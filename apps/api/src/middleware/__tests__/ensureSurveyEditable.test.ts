import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ensureSurveyEditable } from '../ensureSurveyEditable';
import { Survey } from '../../models/Survey';
import { AuthRequest } from '../auth';

// Mock dependencies
vi.mock('../../models/Survey', () => ({
  Survey: {
    findById: vi.fn(),
  },
}));

const mockSurvey = vi.mocked(Survey);

describe('Ensure Survey Editable Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockReq = {
      params: {},
      body: {},
      user: {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      },
      survey: undefined,
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

  describe('ensureSurveyEditable', () => {
    it('should allow editing when survey is not locked', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: false,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow status updates for locked surveys by creator', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject editing locked survey by creator (non-status updates)', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { title: 'Updated Title' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey locked after first publish' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject editing locked survey by non-creator', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439013', // Different user
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle missing survey ID', async () => {
      mockReq.params = {};

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey ID required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null survey ID', async () => {
      mockReq.params = { surveyId: null as any };

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey ID required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined survey ID', async () => {
      mockReq.params = { surveyId: undefined as any };

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey ID required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty string survey ID', async () => {
      mockReq.params = { surveyId: '' };

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey ID required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only survey ID', async () => {
      mockReq.params = { surveyId: '   ' };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey not found', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Database connection failed'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database timeout', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Database timeout'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database permission error', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Permission denied'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid survey ID format', async () => {
      mockReq.params = { surveyId: 'invalid-object-id' };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle very long survey ID', async () => {
      const longSurveyId = 'a'.repeat(1000);
      mockReq.params = { surveyId: longSurveyId };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey ID with special characters', async () => {
      mockReq.params = { surveyId: 'survey-id-with-special-chars!@#$%^&*()' };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey ID with unicode characters', async () => {
      mockReq.params = { surveyId: 'survey-id-with-unicode-测试' };
      mockSurvey.findById.mockResolvedValue(null);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey with null createdBy', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: null,
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle survey with undefined createdBy', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: undefined,
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle survey with empty string createdBy', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle user with null _id', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.user = { _id: null, email: 'test@example.com' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle user with undefined _id', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.user = { _id: undefined, email: 'test@example.com' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle user with empty string _id', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.user = { _id: '', email: 'test@example.com' };
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle undefined user', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.user = undefined;
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle null user', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.user = null;
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: 'published' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle status update with null value', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: null };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle status update with undefined value', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: undefined };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Survey locked after first publish' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle status update with empty string value', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: '' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle status update with whitespace-only value', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockReq.body = { status: '   ' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle concurrent survey editability checks', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: false,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext)
      );

      await Promise.all(promises);

      expect(mockSurvey.findById).toHaveBeenCalledTimes(10);
      expect(mockNext).toHaveBeenCalledTimes(10);
    });

    it('should handle memory exhaustion during survey lookup', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Memory exhausted'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle network interruption during survey lookup', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Network interrupted'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rapid survey editability checks', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: false,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      const startTime = Date.now();
      
      // Simulate rapid requests
      for (let i = 0; i < 100; i++) {
        await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(mockSurvey.findById).toHaveBeenCalledTimes(100);
    });

    it('should handle corrupted survey data', async () => {
      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockRejectedValue(new Error('Corrupted survey data'));

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error checking survey editability' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle survey with missing locked field', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        createdBy: '507f1f77bcf86cd799439011',
        // locked field missing
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle survey with null locked field', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: null,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle survey with undefined locked field', async () => {
      const mockSurveyData = {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Survey',
        locked: undefined,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockReq.params = { surveyId: '507f1f77bcf86cd799439012' };
      mockSurvey.findById.mockResolvedValue(mockSurveyData);

      await ensureSurveyEditable(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockSurvey.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockReq.survey).toEqual(mockSurveyData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
