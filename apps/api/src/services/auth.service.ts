import { AuthRepository } from '../repository/auth.repository';
import { IUser } from '../models/User';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth';
import log from '../logger';
import crypto from 'crypto';

export class AuthService {
  private readonly repo = new AuthRepository();

  async register(email: string, password: string, role: 'creator' | 'respondent' = 'respondent') {
    const emailHash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 12);
    log.info('User registration attempt', 'register', { emailHash, role });
    if (!email || !password) {
      log.warn('Registration validation failed: Missing credentials', 'register', { emailHash });
      throw new Error('Email and password required');
    }
    const existingUser = await this.repo.findByEmail(email);
    if (existingUser) {
      log.warn('Registration failed: User already exists', 'register', { emailHash });
      throw new Error('User already exists');
    }
    const passwordHash = await hashPassword(password);
    const user = await this.repo.create({ email, passwordHash, role });
    const userId = (user._id as string); // ✅ _id fix
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    log.info('User registered successfully', 'register', { userId, emailHash, role });
    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const emailHash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 12);
    log.info('User login attempt', 'login', { emailHash });
    if (!email || !password) {
      log.warn('Login validation failed: Missing credentials', 'login', { emailHash });
      throw new Error('Email and password required');
    }
    const user = await this.repo.findByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash!))) {
      log.warn('Login failed: Invalid credentials', 'login', { emailHash });
      throw new Error('Invalid credentials');
    }
    const userId = (user._id as string); // ✅ _id fix
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    log.info('User logged in successfully', 'login', { userId, emailHash });
    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    log.debug('Refreshing access token', 'refresh');
    if (!refreshToken) {
      log.warn('Refresh validation failed: Missing token', 'refresh');
      throw new Error('Refresh token required');
    }
    const decoded = verifyRefreshToken(refreshToken);
    const user = await this.repo.findById(decoded.userId);
    if (!user) {
      log.warn('Refresh failed: User not found', 'refresh', { userId: decoded.userId });
      throw new Error('User not found');
    }
    const userId = (user._id as string);
    const accessToken = generateAccessToken(userId);
    log.debug('Access token refreshed successfully', 'refresh', { userId });
    return { accessToken };
  }

  async getCurrentUser(userId: string) {
    log.debug('Fetching current user', 'getCurrentUser', { userId });
    const user = await this.repo.findById(userId);
    if (!user) {
      log.warn('User not found', 'getCurrentUser', { userId });
      throw new Error('User not found');
    }
    log.debug('Current user retrieved', 'getCurrentUser', { userId });
    return user;
  }

  async findOrCreateSsoUser(profile: {
    email: string;
    name?: string;
    oid?: string;
    role?: 'creator' | 'respondent';
  }): Promise<IUser> {
    const normalizedEmail = profile.email.toLowerCase();
    let user = await this.repo.findByEmail(normalizedEmail);

    if (!user) {
      user = await this.repo.create({
        email: normalizedEmail,
        name: profile.name,
        oid: profile.oid,
        role: profile.role ?? 'creator',
        ssoAuth: true,
      });
      log.info('Created new user from Microsoft SSO', 'SSO_USER_CREATE', {
        email: normalizedEmail,
        oid: profile.oid,
        role: profile.role ?? 'creator',
      });
      return user;
    }

    let needsSave = false;

    if (profile.name && user.name !== profile.name) {
      user.name = profile.name;
      needsSave = true;
    }

    if (profile.oid && user.oid !== profile.oid) {
      user.oid = profile.oid;
      needsSave = true;
    }

    if (!user.ssoAuth) {
      user.ssoAuth = true;
      needsSave = true;
    }

    if (!user.role) {
      user.role = profile.role ?? 'creator';
      needsSave = true;
    }

    if (needsSave) {
      user = await this.repo.save(user);
      log.info('Updated existing user with Microsoft SSO data', 'SSO_USER_UPDATE', {
        userId: (user._id as any).toString(),
        email: user.email,
      });
    }

    return user;
  }

  async issueTokensForUser(user: IUser) {
    const userId = (user._id as any).toString();
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return { user, accessToken, refreshToken };
  }
}

