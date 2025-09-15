import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { migrateSurveyLock } from '../migrateSurveyLock';
import { Survey } from '../../models/Survey';

// Mock the Survey model
vi.mock('../../models/Survey', () => ({
  Survey: {
    find: vi.fn(),
  },
}));

const mockedSurvey = vi.mocked(Survey);

describe('Migrate Survey Lock Utility', () => {
  let mockSurveys: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock survey data
    mockSurveys = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'Published Survey 1',
        status: 'published',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'Closed Survey 1',
        status: 'closed',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      },
      {
        _id: '507f1f77bcf86cd799439013',
        title: 'Published Survey 2',
        status: 'published',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('migrateSurveyLock', () => {
    it('should migrate surveys successfully', async () => {
      mockedSurvey.find.mockResolvedValue(mockSurveys);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 3,
      });

      expect(mockedSurvey.find).toHaveBeenCalledWith({
        status: { $in: ['published', 'closed'] }
      });

      // Check that each survey was saved
      mockSurveys.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle empty survey list', async () => {
      mockedSurvey.find.mockResolvedValue([]);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 0,
      });

      expect(mockedSurvey.find).toHaveBeenCalledWith({
        status: { $in: ['published', 'closed'] }
      });
    });

    it('should handle single survey', async () => {
      const singleSurvey = [mockSurveys[0]];
      mockedSurvey.find.mockResolvedValue(singleSurvey);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 1,
      });

      expect(singleSurvey[0].save).toHaveBeenCalled();
      expect(singleSurvey[0].locked).toBe(true);
    });

    it('should handle large number of surveys', async () => {
      const largeSurveyList = Array.from({ length: 1000 }, (_, i) => ({
        _id: `507f1f77bcf86cd7994390${i.toString().padStart(3, '0')}`,
        title: `Survey ${i}`,
        status: i % 2 === 0 ? 'published' : 'closed',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      }));

      mockedSurvey.find.mockResolvedValue(largeSurveyList);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 1000,
      });

      largeSurveyList.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with different statuses', async () => {
      const mixedSurveys = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Draft Survey',
          status: 'draft',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Published Survey',
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Closed Survey',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439014',
          title: 'Archived Survey',
          status: 'archived',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      // Only published and closed surveys should be found
      const targetSurveys = mixedSurveys.filter(s => s.status === 'published' || s.status === 'closed');
      mockedSurvey.find.mockResolvedValue(targetSurveys);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      targetSurveys.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys that are already locked', async () => {
      const alreadyLockedSurveys = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Already Locked Survey',
          status: 'published',
          locked: true,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(alreadyLockedSurveys);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 1,
      });

      expect(alreadyLockedSurveys[0].save).toHaveBeenCalled();
      expect(alreadyLockedSurveys[0].locked).toBe(true);
    });

    it('should handle database connection error', async () => {
      const error = new Error('Database connection failed');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Database connection failed');
    });

    it('should handle database timeout error', async () => {
      const error = new Error('Database timeout');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Database timeout');
    });

    it('should handle database permission error', async () => {
      const error = new Error('Database permission denied');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Database permission denied');
    });

    it('should handle save error for individual survey', async () => {
      const surveysWithSaveError = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Survey with Save Error',
          status: 'published',
          locked: false,
          save: vi.fn().mockRejectedValue(new Error('Save failed')),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithSaveError);

      await expect(migrateSurveyLock()).rejects.toThrow('Save failed');
    });

    it('should handle partial save failures', async () => {
      const surveysWithPartialFailure = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Survey 1',
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Survey 2',
          status: 'closed',
          locked: false,
          save: vi.fn().mockRejectedValue(new Error('Save failed')),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithPartialFailure);

      await expect(migrateSurveyLock()).rejects.toThrow('Save failed');
    });

    it('should handle network interruption during migration', async () => {
      const error = new Error('Network interruption');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Network interruption');
    });

    it('should handle memory exhaustion during migration', async () => {
      const error = new Error('Memory exhausted');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Memory exhausted');
    });

    it('should handle concurrent migration attempts', async () => {
      mockedSurvey.find.mockResolvedValue(mockSurveys);

      const promises = Array.from({ length: 5 }, () => migrateSurveyLock());

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual({
          success: true,
          migratedCount: 3,
        });
      });
    });

    it('should handle surveys with missing required fields', async () => {
      const incompleteSurveys = [
        {
          _id: '507f1f77bcf86cd799439011',
          // Missing title
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Complete Survey',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(incompleteSurveys);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      incompleteSurveys.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with null values', async () => {
      const surveysWithNulls = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: null,
          status: 'published',
          locked: null,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Valid Survey',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithNulls);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      surveysWithNulls.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with undefined values', async () => {
      const surveysWithUndefined = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: undefined,
          status: 'published',
          locked: undefined,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Valid Survey',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithUndefined);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      surveysWithUndefined.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with very long titles', async () => {
      const surveysWithLongTitles = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'A'.repeat(10000),
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'B'.repeat(50000),
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithLongTitles);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      surveysWithLongTitles.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with special characters in titles', async () => {
      const surveysWithSpecialChars = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Survey with "quotes" & <tags>',
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Survey with \'single quotes\' and "double quotes"',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithSpecialChars);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      surveysWithSpecialChars.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle surveys with unicode characters', async () => {
      const surveysWithUnicode = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Tëst Survëy with Ünicödé',
          status: 'published',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          title: '调查问卷 with 中文',
          status: 'closed',
          locked: false,
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      mockedSurvey.find.mockResolvedValue(surveysWithUnicode);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 2,
      });

      surveysWithUnicode.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });

    it('should handle performance with large datasets', async () => {
      const largeSurveyList = Array.from({ length: 10000 }, (_, i) => ({
        _id: `507f1f77bcf86cd7994390${i.toString().padStart(4, '0')}`,
        title: `Survey ${i}`,
        status: i % 2 === 0 ? 'published' : 'closed',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      }));

      mockedSurvey.find.mockResolvedValue(largeSurveyList);

      const startTime = Date.now();
      const result = await migrateSurveyLock();
      const endTime = Date.now();

      expect(result).toEqual({
        success: true,
        migratedCount: 10000,
      });

      // Performance should be reasonable (less than 30 seconds for 10k records)
      expect(endTime - startTime).toBeLessThan(30000);
    });

    it('should handle memory usage with large datasets', async () => {
      const largeSurveyList = Array.from({ length: 50000 }, (_, i) => ({
        _id: `507f1f77bcf86cd7994390${i.toString().padStart(5, '0')}`,
        title: `Survey ${i}`,
        status: i % 2 === 0 ? 'published' : 'closed',
        locked: false,
        save: vi.fn().mockResolvedValue(true),
      }));

      mockedSurvey.find.mockResolvedValue(largeSurveyList);

      const result = await migrateSurveyLock();

      expect(result).toEqual({
        success: true,
        migratedCount: 50000,
      });

      // All surveys should be processed
      largeSurveyList.forEach(survey => {
        expect(survey.save).toHaveBeenCalled();
        expect(survey.locked).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database lock timeout', async () => {
      const error = new Error('Database lock timeout');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Database lock timeout');
    });

    it('should handle deadlock scenarios', async () => {
      const error = new Error('Deadlock detected');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Deadlock detected');
    });

    it('should handle transaction rollback', async () => {
      const error = new Error('Transaction rolled back');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Transaction rolled back');
    });

    it('should handle schema validation errors', async () => {
      const error = new Error('Schema validation failed');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Schema validation failed');
    });

    it('should handle index constraint violations', async () => {
      const error = new Error('Index constraint violation');
      mockedSurvey.find.mockRejectedValue(error);

      await expect(migrateSurveyLock()).rejects.toThrow('Index constraint violation');
    });
  });
});