import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateRespondent } from '../validateRespondent';
import type { RespondentRequest } from '../validateRespondent';
import { Survey } from '../../models/Survey';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JsonWebTokenError';
      }
    },
    TokenExpiredError: class TokenExpiredError extends Error {
      expiredAt: Date;
      constructor(message: string, expiredAt: Date) {
        super(message);
        this.name = 'TokenExpiredError';
        this.expiredAt = expiredAt;
      }
    },
  },
  verify: vi.fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  },
  TokenExpiredError: class TokenExpiredError extends Error {
    expiredAt: Date;
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.name = 'TokenExpiredError';
      this.expiredAt = expiredAt;
    }
  },
}));

vi.mock('../../models/Survey', () => ({
  Survey: {
    findById: vi.fn(),
  },
}));

const mockJwt = vi.mocked(jwt);
const mockSurvey = vi.mocked(Survey);

describe('Validate Respondent Middleware', () => {
  let mockReq: Partial<RespondentRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockReq = {
      query: {},
      headers: {},
      params: {},
      respondentEmail: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Set up default environment variable
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateRespondent', () => {
    it('should validate respondent with valid token from query params', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.respondentEmail).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate respondent with valid token from Authorization header', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.respondentEmail).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject request with missing token', async () => {
      mockReq.query = {};
      mockReq.headers = {};

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with null token in query', async () => {
      mockReq.query = { token: null as any };
      mockReq.headers = {};

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with undefined token in query', async () => {
      mockReq.query = { token: undefined };
      mockReq.headers = {};

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty string token', async () => {
      mockReq.query = { token: '' };
      mockReq.headers = {};

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with whitespace-only token', async () => {
      mockReq.query = { token: '   ' };
      mockReq.headers = {};

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid token format', async () => {
      mockReq.query = { token: 'invalid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      mockReq.query = { token: 'expired-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed token', async () => {
      mockReq.query = { token: 'malformed.token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Malformed token');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with missing signature', async () => {
      mockReq.query = { token: 'token-without-signature' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Missing signature');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token for wrong survey', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439013', // Different survey ID
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey not found', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(null);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle email not in allowed respondents', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['other@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty allowed respondents array', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: [],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Database connection failed'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database timeout', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Database timeout'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database permission error', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Permission denied'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle very long token', async () => {
      const longToken = 'a'.repeat(10000);
      mockReq.query = { token: longToken };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Token too long');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with special characters', async () => {
      mockReq.query = { token: 'token-with-special-chars!@#$%^&*()' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid characters in token');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with unicode characters', async () => {
      mockReq.query = { token: 'token-with-unicode-测试' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid unicode in token');
      });

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with null surveyId', async () => {
      const mockDecodedToken = {
        surveyId: null,
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with undefined surveyId', async () => {
      const mockDecodedToken = {
        surveyId: undefined,
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with empty string surveyId', async () => {
      const mockDecodedToken = {
        surveyId: '',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with null email', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: null,
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with undefined email', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: undefined,
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with empty string email', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: '',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with whitespace-only email', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: '   ',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email not authorized for this survey' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle concurrent respondent validations', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext)
      );

      await Promise.all(promises);

      expect(mockJwt.verify).toHaveBeenCalledTimes(10);
      expect(mockSurvey.findById).toHaveBeenCalledTimes(10);
    });

    it('should handle memory exhaustion during survey lookup', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Memory exhausted'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle network interruption during survey lookup', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Network interrupted'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rapid respondent validations', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      const startTime = Date.now();
      
      // Simulate rapid requests
      for (let i = 0; i < 100; i++) {
        await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(mockJwt.verify).toHaveBeenCalledTimes(100);
    });

    it('should handle corrupted survey data', async () => {
      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockRejectedValue(new Error('Corrupted survey data'));

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey with missing allowedRespondents field', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        // allowedRespondents field missing
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey with null allowedRespondents', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: null,
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey with undefined allowedRespondents', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: undefined,
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.query = { token: 'valid-token' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Authorization header with missing Bearer prefix', async () => {
      mockReq.headers = { authorization: 'valid-token' }; // Missing 'Bearer ' prefix
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Authorization header with empty Bearer token', async () => {
      mockReq.headers = { authorization: 'Bearer ' }; // Empty token after Bearer
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Authorization header with whitespace-only Bearer token', async () => {
      mockReq.headers = { authorization: 'Bearer    ' }; // Whitespace-only token
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Authorization header with multiple spaces', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        allowedRespondents: ['test@example.com'],
      };

      const mockDecodedToken = {
        surveyId: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
      };

      mockReq.headers = { authorization: 'Bearer   valid-token   ' }; // Multiple spaces
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as any);
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await validateRespondent(mockReq as RespondentRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
