import { AuthRepository } from '../repository/auth.repository';
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
}

