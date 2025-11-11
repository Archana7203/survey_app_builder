import express, { type RequestHandler, type Response } from 'express';
import msal, { AuthorizationCodeRequest } from '@azure/msal-node';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';  // ✅ Import logger

const router = express.Router();
const service = new AuthService();
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const buildCookieOptions = (maxAge: number) => {
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
  } as const;

  if (!cookieDomain) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    domain: cookieDomain,
  } as const;
};

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  res.cookie('accessToken', tokens.accessToken, buildCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
  res.cookie('refreshToken', tokens.refreshToken, buildCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE));
};

// SSO safety: lazy-init MSAL and guard against missing env
const isSsoConfigured = () => {
  return Boolean(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_TENANT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.MICROSOFT_REDIRECT_URI &&
    process.env.FRONTEND_URL
  );
};

const createCca = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !tenantId || !clientSecret) {
    throw new Error('SSO is not configured');
  }
  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  } as const;
  return new msal.ConfidentialClientApplication(msalConfig);
};

// SSO Login - redirect to Microsoft
const handleMicrosoftLogin: RequestHandler = (_req, res) => {
  try {
    if (!isSsoConfigured()) {
      log.warn('SSO not configured, blocking /sso/login', 'SSO_LOGIN');
      return res.status(503).json({ error: 'SSO is not configured' });
    }

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      response_type: 'code',
      response_mode: 'query',
      scope: 'openid profile email offline_access',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!
    });
    
    const authUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
    
    log.info('Initiating SSO login', 'SSO_LOGIN');
    res.redirect(authUrl);
  } catch (error: any) {
    log.error('SSO login initiation failed', 'SSO_LOGIN', { error: error.message });
    res.status(500).json({ error: 'Failed to initiate login' });
  }
};

router.get('/sso/login', handleMicrosoftLogin);
router.get('/microsoft/login', handleMicrosoftLogin);

// SSO Callback - handle Microsoft OAuth callback
const handleMicrosoftCallback: RequestHandler = async (req, res, next) => {
  try {
    if (!isSsoConfigured()) {
      log.warn('SSO not configured, blocking /sso/callback', 'SSO_CALLBACK');
      return res.redirect(`${process.env.FRONTEND_URL || ''}?error=sso_not_configured`);
    }

    const code = req.query.code as string | undefined;
    
    if (!code) {
      log.warn('SSO callback missing code', 'SSO_CALLBACK');
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    log.info('SSO callback received', 'SSO_CALLBACK', { hasCode: !!code });

    const tokenRequest: AuthorizationCodeRequest = {
      code,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
      scopes: ['openid', 'profile', 'email'],
    };

    const cca = createCca();
    const response = await cca.acquireTokenByCode(tokenRequest);
    
    if (!response?.idTokenClaims) {
      throw new Error('Failed to acquire token from Azure AD');
    }

    const idTokenClaims = response.idTokenClaims as {
      oid?: string;
      name?: string;
      preferred_username?: string;
      email?: string;
    };
    
    const ssoUser = {
      oid: idTokenClaims.oid || '',
      name: idTokenClaims.name || '',
      email: idTokenClaims.preferred_username || idTokenClaims.email || '',
    };

    if (!ssoUser.email) {
      throw new Error('Microsoft account did not return an email address');
    }

    const applicationUser = await service.findOrCreateSsoUser({
      email: ssoUser.email,
      name: ssoUser.name,
      oid: ssoUser.oid,
      role: 'creator',
    });

    const { accessToken, refreshToken } = await service.issueTokensForUser(applicationUser);
    const appUserId = (applicationUser._id as any).toString();

    req.session.regenerate((regenError) => {
      if (regenError) {
        log.error('Session regeneration failed', 'SSO_CALLBACK', {
          error: regenError.message,
          stack: regenError.stack,
        });
        next(regenError);
        return;
      }

      req.session.user = {
        oid: ssoUser.oid,
        name: ssoUser.name,
        email: ssoUser.email,
        id: appUserId,
      };

      req.session.save((saveError) => {
        if (saveError) {
          log.error('Session save failed', 'SSO_CALLBACK', {
            error: saveError.message,
            stack: saveError.stack,
          });
          next(saveError);
          return;
        }

        setAuthCookies(res, { accessToken, refreshToken });

        log.info('SSO login successful', 'SSO_CALLBACK', { email: ssoUser.email });
        const redirectUrl = `${process.env.FRONTEND_URL}/dashboard`;
        res.redirect(redirectUrl);
      });
    });
  } catch (error: any) {
    log.error('SSO callback failed', 'SSO_CALLBACK', { 
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

router.get('/sso/callback', handleMicrosoftCallback);
router.get('/microsoft/callback', handleMicrosoftCallback);

// SSO Logout - destroy session and redirect to Microsoft logout
const handleMicrosoftLogout: RequestHandler = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const tenantId = process.env.MICROSOFT_TENANT_ID;

  req.session.destroy((err) => {
    if (err) {
      log.error('Session destruction failed', 'SSO_LOGOUT', { error: err.message });
      return res.status(500).json({ error: 'Logout failed' });
    }

    log.info('SSO logout successful', 'SSO_LOGOUT');
    
    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${frontendUrl}`;
    res.redirect(logoutUrl);
  });
};

router.get('/sso/logout', handleMicrosoftLogout);
router.get('/microsoft/logout', handleMicrosoftLogout);

// Get current SSO user
const handleMicrosoftMe: RequestHandler = (req, res) => {
  if (req.session?.user) {
    log.info('Fetching SSO user info', 'SSO_ME', { email: req.session.user.email });
    return res.json({ user: req.session.user });
  }
  
  log.warn('No SSO session found', 'SSO_ME');
  return res.status(401).json({ error: 'Not authenticated' });
};

router.get('/sso/me', handleMicrosoftMe);
router.get('/microsoft/me', handleMicrosoftMe);

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    log.info('User registration attempt', 'REGISTER', { email, role });
    
    const { user, accessToken, refreshToken } = await service.register(email, password, role);

    setAuthCookies(res, { accessToken, refreshToken });

    log.info('User registered successfully', 'REGISTER', { 
      userId: (user._id as any).toString(), 
      email: user.email, 
      role: user.role 
    });
    
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        name: user.name ?? null,
        ssoAuth: Boolean(user.ssoAuth),
        oid: user.oid ?? null
      }
    });
  } catch (error: any) {
    log.error('Registration failed', 'REGISTER', { 
      email: req.body.email,
      error: error.message,
      stack: error.stack 
    });
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    log.info('Login attempt', 'LOGIN', { email });
    const { user, accessToken, refreshToken } = await service.login(email, password);

    setAuthCookies(res, { accessToken, refreshToken });

    log.info('Login successful', 'LOGIN', { 
      userId: (user._id as any).toString(), 
      email: user.email 
    });
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        name: user.name ?? null,
        ssoAuth: Boolean(user.ssoAuth),
        oid: user.oid ?? null
      }
    });
  } catch (error: any) {
    log.warn('Login failed', 'LOGIN', { 
      email: req.body.email,
      error: error.message 
    });
    res.status(401).json({ error: error.message || 'Server error' });
  }
});

// Refresh
router.post('/refresh', async (req, res) => {
  try {
    log.info('Token refresh attempt', 'REFRESH_TOKEN');
    
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await service.refresh(refreshToken);

    res.cookie('accessToken', accessToken, buildCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    
    log.info('Token refreshed successfully', 'REFRESH_TOKEN');
    res.json({ message: 'Token refreshed' });
  } catch (error: any) {
    log.warn('Token refresh failed', 'REFRESH_TOKEN', { 
      error: error.message 
    });
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  log.info('User logged out', 'LOGOUT');

  const clearCookies = () => {
    res.clearCookie('accessToken', buildCookieOptions(ACCESS_TOKEN_COOKIE_MAX_AGE));
    res.clearCookie('refreshToken', buildCookieOptions(REFRESH_TOKEN_COOKIE_MAX_AGE));
    res.json({ message: 'Logged out successfully' });
  };

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        log.error('Session destruction failed during logout', 'LOGOUT', { error: err.message });
      }
      clearCookies();
    });
    return;
  }

  clearCookies();
});

// Current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id.toString();
    log.info('Fetching current user', 'GET_ME', { userId });
    const user = await service.getCurrentUser(userId);

    log.httpResponse(req, res, { user }, 'GET_ME');
    const sessionUser = req.session?.user;
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        name: user.name ?? sessionUser?.name ?? null,
        ssoAuth: Boolean(user.ssoAuth || sessionUser),
        oid: user.oid ?? sessionUser?.oid ?? null
      }
    });
  } catch (error: any) {
    log.error('Failed to fetch current user', 'GET_ME', { 
      userId: req.user?._id.toString(),
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: error.message || 'Server error' });
  }
});
export default router;
