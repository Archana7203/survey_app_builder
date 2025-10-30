import express from 'express';
import msal, { AuthorizationCodeRequest } from '@azure/msal-node';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';  // ✅ Import logger

const router = express.Router();
const service = new AuthService();

// MSAL configuration for SSO
const msalConfig = {
  auth: {
    clientId: process.env.YOUR_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.YOUR_TENANT_ID}`,
    clientSecret: process.env.YOUR_CLIENT_SECRET!
  }
};
const cca = new msal.ConfidentialClientApplication(msalConfig);

// SSO Login - redirect to Microsoft
router.get('/sso/login', (_req, res) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.YOUR_CLIENT_ID!,
      response_type: 'code',
      response_mode: 'query',
      scope: 'openid profile email offline_access',
      redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`
    });
    
    const authUrl = `https://login.microsoftonline.com/${process.env.YOUR_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
    
    log.info('Initiating SSO login', 'SSO_LOGIN');
    res.redirect(authUrl);
  } catch (error: any) {
    log.error('SSO login initiation failed', 'SSO_LOGIN', { error: error.message });
    res.status(500).json({ error: 'Failed to initiate login' });
  }
});

// SSO Callback - handle Microsoft OAuth callback
router.get('/sso/callback', async (req, res, next) => {
  try {
    const code = req.query.code as string;
    
    if (!code) {
      log.warn('SSO callback missing code', 'SSO_CALLBACK');
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    log.info('SSO callback received', 'SSO_CALLBACK', { hasCode: !!code });

    const tokenRequest: AuthorizationCodeRequest = {
      code: code,
      redirectUri: `${process.env.FRONTEND_URL}/auth/callback`,
      scopes: ['openid', 'profile', 'email']
    };

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
    
    // Store user info in session
    req.session.user = {
      oid: idTokenClaims.oid || '',
      name: idTokenClaims.name || '',
      email: idTokenClaims.preferred_username || idTokenClaims.email || ''
    };

    log.info('SSO login successful', 'SSO_CALLBACK', { 
      email: req.session.user.email 
    });

    res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (error: any) {
    log.error('SSO callback failed', 'SSO_CALLBACK', { 
      error: error.message,
      stack: error.stack 
    });
    next(error);
  }
});

// SSO Logout - destroy session and redirect to Microsoft logout
router.get('/sso/logout', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const tenantId = process.env.YOUR_TENANT_ID;

  req.session.destroy((err) => {
    if (err) {
      log.error('Session destruction failed', 'SSO_LOGOUT', { error: err.message });
      return res.status(500).json({ error: 'Logout failed' });
    }

    log.info('SSO logout successful', 'SSO_LOGOUT');
    
    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${frontendUrl}`;
    res.redirect(logoutUrl);
  });
});

// Get current SSO user
router.get('/sso/me', (req, res) => {
  if (req.session?.user) {
    log.info('Fetching SSO user info', 'SSO_ME', { email: req.session.user.email });
    return res.json({ user: req.session.user });
  }
  
  log.warn('No SSO session found', 'SSO_ME');
  return res.status(401).json({ error: 'Not authenticated' });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    log.info('User registration attempt', 'REGISTER', { email, role });
    
    const { user, accessToken, refreshToken } = await service.register(email, password, role);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info('User registered successfully', 'REGISTER', { 
      userId: (user._id as any).toString(), 
      email: user.email, 
      role: user.role 
    });
    
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
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

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info('Login successful', 'LOGIN', { 
      userId: (user._id as any).toString(), 
      email: user.email 
    });
    
    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
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

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    
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
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id.toString();
    log.info('Fetching current user', 'GET_ME', { userId });
    const user = await service.getCurrentUser(userId);

    log.httpResponse(req, res, { user }, 'GET_ME');
    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
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
