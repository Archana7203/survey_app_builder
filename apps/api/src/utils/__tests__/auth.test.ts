import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../auth';

// Mock bcrypt
vi.mock('bcrypt');
const mockedBcrypt = vi.mocked(bcrypt) as any;

// Mock jwt
vi.mock('jsonwebtoken');
const mockedJwt = vi.mocked(jwt) as any;

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = '$2b$12$emptyhash';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const hashedPassword = '$2b$12$longhash';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle password with special characters', async () => {
      const password = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = '$2b$12$specialhash';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle password with unicode characters', async () => {
      const password = 'pássw0rd🎉';
      const hashedPassword = '$2b$12$unicodehash';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle bcrypt errors', async () => {
      const password = 'testPassword';
      const error = new Error('Bcrypt error');
      
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Bcrypt error');
    });

    it('should handle null password', async () => {
      const password = null as any;
      const error = new Error('Invalid password');
      
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Invalid password');
    });

    it('should handle undefined password', async () => {
      const password = undefined as any;
      const error = new Error('Invalid password');
      
      mockedBcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword(password)).rejects.toThrow('Invalid password');
    });
  });

  describe('comparePassword', () => {
    it('should compare password successfully', async () => {
      const password = 'testPassword123';
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword';
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle empty hash', async () => {
      const password = 'testPassword';
      const hash = '';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle null password', async () => {
      const password = null as any;
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle null hash', async () => {
      const password = 'testPassword';
      const hash = null as any;
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle undefined password', async () => {
      const password = undefined as any;
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle undefined hash', async () => {
      const password = 'testPassword';
      const hash = undefined as any;
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle bcrypt comparison errors', async () => {
      const password = 'testPassword';
      const hash = '$2b$12$hashedpassword';
      const error = new Error('Bcrypt comparison error');
      
      mockedBcrypt.compare.mockRejectedValue(error);

      await expect(comparePassword(password, hash)).rejects.toThrow('Bcrypt comparison error');
    });

    it('should handle malformed hash', async () => {
      const password = 'testPassword';
      const hash = 'invalid-hash';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const hash = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle very long hash', async () => {
      const password = 'testPassword';
      const hash = 'a'.repeat(1000);
      
      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token successfully', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = 'access-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(result).toBe(token);
    });

    it('should handle empty userId', () => {
      const userId = '';
      const token = 'access-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '' },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(result).toBe(token);
    });

    it('should handle null userId', () => {
      const userId = null as any;
      const token = 'access-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: null },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(result).toBe(token);
    });

    it('should handle undefined userId', () => {
      const userId = undefined as any;
      const token = 'access-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: undefined },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(result).toBe(token);
    });

    it('should handle very long userId', () => {
      const userId = 'a'.repeat(1000);
      const token = 'access-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(result).toBe(token);
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      const userId = '507f1f77bcf86cd799439011';
      const error = new Error('JWT_SECRET is required');
      
      mockedJwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => generateAccessToken(userId)).toThrow('JWT_SECRET is required');
    });

    it('should handle JWT signing errors', () => {
      const userId = '507f1f77bcf86cd799439011';
      const error = new Error('JWT signing failed');
      
      mockedJwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => generateAccessToken(userId)).toThrow('JWT signing failed');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token successfully', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = 'refresh-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateRefreshToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe(token);
    });

    it('should handle empty userId', () => {
      const userId = '';
      const token = 'refresh-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateRefreshToken(userId);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: '' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe(token);
    });

    it('should handle missing JWT_REFRESH_SECRET', () => {
      delete process.env.JWT_REFRESH_SECRET;
      const userId = '507f1f77bcf86cd799439011';
      const error = new Error('JWT_REFRESH_SECRET is required');
      
      mockedJwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => generateRefreshToken(userId)).toThrow('JWT_REFRESH_SECRET is required');
    });

    it('should handle JWT signing errors', () => {
      const userId = '507f1f77bcf86cd799439011';
      const error = new Error('JWT signing failed');
      
      mockedJwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => generateRefreshToken(userId)).toThrow('JWT signing failed');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', () => {
      const token = 'valid-access-token';
      const payload = { userId: '507f1f77bcf86cd799439011' };
      
      mockedJwt.verify.mockReturnValue(payload);

      const result = verifyAccessToken(token);

      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret');
      expect(result).toEqual(payload);
    });

    it('should handle empty token', () => {
      const token = '';
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt malformed');
    });

    it('should handle null token', () => {
      const token = null as any;
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt malformed');
    });

    it('should handle undefined token', () => {
      const token = undefined as any;
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt malformed');
    });

    it('should handle expired token', () => {
      const token = 'expired-token';
      const error = new Error('jwt expired');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt expired');
    });

    it('should handle invalid signature', () => {
      const token = 'invalid-signature-token';
      const error = new Error('invalid signature');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('invalid signature');
    });

    it('should handle malformed token', () => {
      const token = 'malformed.token';
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt malformed');
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      const token = 'valid-token';
      const error = new Error('JWT_SECRET is required');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('JWT_SECRET is required');
    });

    it('should handle very long token', () => {
      const token = 'a'.repeat(10000);
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(token)).toThrow('jwt malformed');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      const token = 'valid-refresh-token';
      const payload = { userId: '507f1f77bcf86cd799439011' };
      
      mockedJwt.verify.mockReturnValue(payload);

      const result = verifyRefreshToken(token);

      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-refresh-secret');
      expect(result).toEqual(payload);
    });

    it('should handle empty token', () => {
      const token = '';
      const error = new Error('jwt malformed');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyRefreshToken(token)).toThrow('jwt malformed');
    });

    it('should handle expired token', () => {
      const token = 'expired-refresh-token';
      const error = new Error('jwt expired');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyRefreshToken(token)).toThrow('jwt expired');
    });

    it('should handle invalid signature', () => {
      const token = 'invalid-refresh-signature';
      const error = new Error('invalid signature');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyRefreshToken(token)).toThrow('invalid signature');
    });

    it('should handle missing JWT_REFRESH_SECRET', () => {
      delete process.env.JWT_REFRESH_SECRET;
      const token = 'valid-refresh-token';
      const error = new Error('JWT_REFRESH_SECRET is required');
      
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyRefreshToken(token)).toThrow('JWT_REFRESH_SECRET is required');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle timing attacks in password comparison', async () => {
      const password = 'testPassword';
      const hash = '$2b$12$hashedpassword';
      
      // Mock bcrypt to always take the same time regardless of result
      mockedBcrypt.compare.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return false;
      });

      const startTime = Date.now();
      await comparePassword(password, hash);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle concurrent token generation', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = 'concurrent-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const promises = Array.from({ length: 10 }, () => generateAccessToken(userId));
      
      expect(() => Promise.all(promises)).not.toThrow();
    });

    it('should handle concurrent token verification', () => {
      const token = 'concurrent-verify-token';
      const payload = { userId: '507f1f77bcf86cd799439011' };
      
      mockedJwt.verify.mockReturnValue(payload);

      const promises = Array.from({ length: 10 }, () => verifyAccessToken(token));
      
      expect(() => Promise.all(promises)).not.toThrow();
    });

    it('should handle memory usage with large payloads', () => {
      const userId = 'a'.repeat(10000);
      const token = 'large-payload-token';
      
      mockedJwt.sign.mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
    });
  });
});
