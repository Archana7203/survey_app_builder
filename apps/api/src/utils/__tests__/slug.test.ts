import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { Survey } from '../../models/Survey';
import {
  generateSlug,
  generateUniqueSlug,
} from '../slug';

// Mock Survey model
vi.mock('../../models/Survey', () => ({
  Survey: {
    findOne: vi.fn(),
  },
}));

const mockedSurvey = vi.mocked(Survey);

describe('Slug Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate slug from simple title', () => {
      const title = 'Test Survey';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle empty string', () => {
      const title = '';
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle single word', () => {
      const title = 'Survey';
      const result = generateSlug(title);
      expect(result).toBe('survey');
    });

    it('should handle multiple words', () => {
      const title = 'Customer Satisfaction Survey';
      const result = generateSlug(title);
      expect(result).toBe('customer-satisfaction-survey');
    });

    it('should handle special characters', () => {
      const title = 'Test Survey: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle unicode characters', () => {
      const title = 'Test Survey with émojis 🎉';
      const result = generateSlug(title);
      expect(result).toBe('test-survey-with-mojis');
    });

    it('should handle numbers', () => {
      const title = 'Survey 2024';
      const result = generateSlug(title);
      expect(result).toBe('survey-2024');
    });

    it('should handle mixed case', () => {
      const title = 'TeSt SuRvEy';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle multiple spaces', () => {
      const title = 'Test    Survey';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle leading and trailing spaces', () => {
      const title = '  Test Survey  ';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle multiple hyphens', () => {
      const title = 'Test--Survey';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle hyphens and spaces', () => {
      const title = 'Test - Survey';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle very long title', () => {
      const title = 'a'.repeat(1000);
      const result = generateSlug(title);
      expect(result).toBe('a'.repeat(1000));
    });

    it('should handle title with only special characters', () => {
      const title = '!@#$%^&*()';
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle title with only spaces', () => {
      const title = '   ';
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle title with only hyphens', () => {
      const title = '---';
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle title with mixed special characters and letters', () => {
      const title = 'Test@#$Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with underscores', () => {
      const title = 'Test_Survey';
      const result = generateSlug(title);
      expect(result).toBe('test-survey');
    });

    it('should handle title with dots', () => {
      const title = 'Test.Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with commas', () => {
      const title = 'Test,Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with semicolons', () => {
      const title = 'Test;Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with colons', () => {
      const title = 'Test:Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with exclamation marks', () => {
      const title = 'Test!Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with question marks', () => {
      const title = 'Test?Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with quotes', () => {
      const title = 'Test"Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with single quotes', () => {
      const title = "Test'Survey";
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with backticks', () => {
      const title = 'Test`Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with parentheses', () => {
      const title = 'Test(Survey)';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with brackets', () => {
      const title = 'Test[Survey]';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with braces', () => {
      const title = 'Test{Survey}';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with pipes', () => {
      const title = 'Test|Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with backslashes', () => {
      const title = 'Test\\Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with forward slashes', () => {
      const title = 'Test/Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with plus signs', () => {
      const title = 'Test+Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with equals signs', () => {
      const title = 'Test=Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with tildes', () => {
      const title = 'Test~Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle title with backticks', () => {
      const title = 'Test`Survey';
      const result = generateSlug(title);
      expect(result).toBe('testsurvey');
    });

    it('should handle null input', () => {
      const title = null as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const title = undefined as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle number input', () => {
      const title = 123 as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle boolean input', () => {
      const title = true as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle object input', () => {
      const title = {} as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle array input', () => {
      const title = [] as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });

    it('should handle function input', () => {
      const title = (() => {}) as any;
      const result = generateSlug(title);
      expect(result).toBe('');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate unique slug when no conflict exists', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(result).toBe(baseSlug);
    });

    it('should generate unique slug with counter when conflict exists', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      const existingSurvey = { _id: '507f1f77bcf86cd799439011', slug: baseSlug };
      
      mockedSurvey.findOne
        .mockResolvedValueOnce(existingSurvey) // First call finds existing
        .mockResolvedValueOnce(null); // Second call finds no conflict

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: 'test-survey-1' });
      expect(result).toBe('test-survey-1');
    });

    it('should generate unique slug with multiple conflicts', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      const existingSurvey = { _id: '507f1f77bcf86cd799439011', slug: baseSlug };
      
      mockedSurvey.findOne
        .mockResolvedValueOnce(existingSurvey) // test-survey exists
        .mockResolvedValueOnce(existingSurvey) // test-survey-1 exists
        .mockResolvedValueOnce(existingSurvey) // test-survey-2 exists
        .mockResolvedValueOnce(null); // test-survey-3 is available

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: 'test-survey-1' });
      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: 'test-survey-2' });
      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: 'test-survey-3' });
      expect(result).toBe('test-survey-3');
    });

    it('should handle empty title', async () => {
      const title = '';
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle title with only special characters', async () => {
      const title = '!@#$%^&*()';
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle title with only spaces', async () => {
      const title = '   ';
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle very long title', async () => {
      const title = 'a'.repeat(1000);
      const baseSlug = 'a'.repeat(1000);
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(result).toBe(baseSlug);
    });

    it('should handle title with unicode characters', async () => {
      const title = 'Test Survey with émojis 🎉';
      const baseSlug = 'test-survey-with-mojis';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(result).toBe(baseSlug);
    });

    it('should handle title with special characters', async () => {
      const title = 'Test Survey: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const baseSlug = 'test-survey';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(result).toBe(baseSlug);
    });

    it('should handle database connection error', async () => {
      const title = 'Test Survey';
      const error = new Error('Database connection failed');
      
      mockedSurvey.findOne.mockRejectedValue(error);

      await expect(generateUniqueSlug(title)).rejects.toThrow('Database connection failed');
    });

    it('should handle database timeout', async () => {
      const title = 'Test Survey';
      const error = new Error('Database timeout');
      
      mockedSurvey.findOne.mockRejectedValue(error);

      await expect(generateUniqueSlug(title)).rejects.toThrow('Database timeout');
    });

    it('should handle database permission error', async () => {
      const title = 'Test Survey';
      const error = new Error('Database permission denied');
      
      mockedSurvey.findOne.mockRejectedValue(error);

      await expect(generateUniqueSlug(title)).rejects.toThrow('Database permission denied');
    });

    it('should handle null title', async () => {
      const title = null as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle undefined title', async () => {
      const title = undefined as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle number title', async () => {
      const title = 123 as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle boolean title', async () => {
      const title = true as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle object title', async () => {
      const title = {} as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle array title', async () => {
      const title = [] as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle function title', async () => {
      const title = (() => {}) as any;
      const baseSlug = '';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      // When baseSlug is empty, findOne should not be called
      expect(mockedSurvey.findOne).not.toHaveBeenCalled();
      expect(result).toBe(baseSlug);
    });

    it('should handle very high counter values', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      const existingSurvey = { _id: '507f1f77bcf86cd799439011', slug: baseSlug };
      
      // Mock many conflicts
      for (let i = 0; i < 1000; i++) {
        mockedSurvey.findOne.mockResolvedValueOnce(existingSurvey);
      }
      // Finally return null for the 1000th attempt
      mockedSurvey.findOne.mockResolvedValueOnce(null);

      const result = await generateUniqueSlug(title);

      expect(result).toBe('test-survey-1000');
    });

    it('should handle concurrent slug generation', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const promises = Array.from({ length: 10 }, () => generateUniqueSlug(title));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(result => result === baseSlug)).toBe(true);
    });

    it('should handle memory usage with large titles', async () => {
      const title = 'a'.repeat(100000);
      const baseSlug = 'a'.repeat(100000);
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(mockedSurvey.findOne).toHaveBeenCalledWith({ slug: baseSlug });
      expect(result).toBe(baseSlug);
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle rapid slug generation', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const startTime = Date.now();
      const result = await generateUniqueSlug(title);
      const endTime = Date.now();

      expect(result).toBe(baseSlug);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle slug generation with many conflicts efficiently', async () => {
      const title = 'Test Survey';
      const baseSlug = 'test-survey';
      const existingSurvey = { _id: '507f1f77bcf86cd799439011', slug: baseSlug };
      
      // Mock 100 conflicts
      for (let i = 0; i < 100; i++) {
        mockedSurvey.findOne.mockResolvedValueOnce(existingSurvey);
      }
      mockedSurvey.findOne.mockResolvedValueOnce(null);

      const startTime = Date.now();
      const result = await generateUniqueSlug(title);
      const endTime = Date.now();

      expect(result).toBe('test-survey-100');
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle slug generation with database errors gracefully', async () => {
      const title = 'Test Survey';
      const error = new Error('Database error');
      
      mockedSurvey.findOne.mockRejectedValue(error);

      await expect(generateUniqueSlug(title)).rejects.toThrow('Database error');
    });

    it('should handle slug generation with network timeout', async () => {
      const title = 'Test Survey';
      const error = new Error('Network timeout');
      
      mockedSurvey.findOne.mockRejectedValue(error);

      await expect(generateUniqueSlug(title)).rejects.toThrow('Network timeout');
    });

    it('should handle slug generation with memory exhaustion', async () => {
      const title = 'a'.repeat(1000000);
      const baseSlug = 'a'.repeat(1000000);
      
      mockedSurvey.findOne.mockResolvedValue(null);

      const result = await generateUniqueSlug(title);

      expect(result).toBe(baseSlug);
    });
  });
});
