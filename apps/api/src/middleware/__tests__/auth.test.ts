import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../auth';
import { verifyAccessToken } from '../../utils/auth';
import { User } from '../../models/User';

// Mock dependencies
vi.mock('../../utils/auth', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../../models/User', () => ({
  User: {
    findById: vi.fn(),
  },
}));

const mockVerifyAccessToken = vi.mocked(verifyAccessToken) as any;
const mockUser = vi.mocked(User) as any;

describe('Authentication Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockReq = {
      cookies: {},
      user: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      const mockFindById = mockUser.findById as any;
      mockFindById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserData)
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockUser.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockReq.user).toEqual(mockUserData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request with missing token', async () => {
      mockReq.cookies = {};

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with null token', async () => {
      mockReq.cookies = { accessToken: null };

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with undefined token', async () => {
      mockReq.cookies = { accessToken: undefined };

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty string token', async () => {
      mockReq.cookies = { accessToken: '' };

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with whitespace-only token', async () => {
      mockReq.cookies = { accessToken: '   ' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token format', async () => {
      mockReq.cookies = { accessToken: 'invalid-token' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      mockReq.cookies = { accessToken: 'expired-token' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed token', async () => {
      mockReq.cookies = { accessToken: 'malformed.token' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with missing signature', async () => {
      mockReq.cookies = { accessToken: 'token-without-signature' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Missing signature');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user not found in database', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockResolvedValue(null);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user deleted from database', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockResolvedValue(null);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Database connection failed'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database timeout', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Database timeout'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database permission error', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Permission denied'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle very long token', async () => {
      const longToken = 'a'.repeat(10000);
      mockReq.cookies = { accessToken: longToken };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Token too long');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with special characters', async () => {
      mockReq.cookies = { accessToken: 'token-with-special-chars!@#$%^&*()' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid characters in token');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with unicode characters', async () => {
      mockReq.cookies = { accessToken: 'token-with-unicode-测试' };
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid unicode in token');
      });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle concurrent authentication requests', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockResolvedValue(mockUserData);

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext)
      );

      await Promise.all(promises);

      expect(mockVerifyAccessToken).toHaveBeenCalledTimes(10);
      expect(mockUser.findById).toHaveBeenCalledTimes(10);
    });

    it('should handle memory exhaustion during user lookup', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Memory exhausted'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle network interruption during user lookup', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Network interrupted'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with null userId', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: null });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with undefined userId', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: undefined });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with empty userId', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '' });

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with invalid userId format', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: 'invalid-object-id' });
      mockUser.findById.mockResolvedValue(null);

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rapid authentication requests', async () => {
      const mockUserData = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockResolvedValue(mockUserData);

      const startTime = Date.now();
      
      // Simulate rapid requests
      for (let i = 0; i < 100; i++) {
        await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(mockVerifyAccessToken).toHaveBeenCalledTimes(100);
    });

    it('should handle authentication with disabled user account', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockResolvedValue(null); // User disabled/deleted

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication with corrupted user data', async () => {
      mockReq.cookies = { accessToken: 'valid-token' };
      mockVerifyAccessToken.mockReturnValue({ userId: '507f1f77bcf86cd799439011' });
      mockUser.findById.mockRejectedValue(new Error('Corrupted user data'));

      await requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
