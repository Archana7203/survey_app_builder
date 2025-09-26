import { AuthRepository } from '../repository/auth.repository';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth';

export class AuthService {
  private repo = new AuthRepository();

  async register(email: string, password: string, role: 'creator' | 'respondent' = 'respondent') {
    if (!email || !password) throw new Error('Email and password required');

    const existingUser = await this.repo.findByEmail(email);
    if (existingUser) throw new Error('User already exists');

    const passwordHash = await hashPassword(password);
    const user = await this.repo.create({ email, passwordHash, role });

    const userId = (user._id as unknown as string); // ✅ _id fix
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    if (!email || !password) throw new Error('Email and password required');

    const user = await this.repo.findByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const userId = (user._id as unknown as string); // ✅ _id fix
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new Error('Refresh token required');

    const decoded = verifyRefreshToken(refreshToken);
    const user = await this.repo.findById(decoded.userId);
    if (!user) throw new Error('User not found');
    const userId = (user._id as unknown as string);
    const accessToken = generateAccessToken(userId); 
    return { accessToken };
  }

  async getCurrentUser(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}
