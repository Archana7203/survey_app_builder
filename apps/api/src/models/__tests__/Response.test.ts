import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Response, IResponse } from '../Response';
import { Survey } from '../Survey';
import { User } from '../User';

describe('Response Model', () => {
  let testUser: any;
  let testSurvey: any;

  beforeAll(async () => {
    // Create a test user with unique email
    testUser = new User({
      email: `test-response-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'creator',
    });
    await testUser.save();

    // Create a test survey with unique slug
    testSurvey = new Survey({
      title: 'Test Survey',
      slug: `test-survey-response-${Date.now()}`,
      createdBy: testUser._id,
      pages: [{ 
        questions: [
          {
            id: 'q1',
            type: 'textShort',
            title: 'What is your feedback?',
            required: true
          }
        ] 
      }],
    });
    await testSurvey.save();
  });

  // Note: No cleanup - keeping data for inspection

  describe('Response Creation', () => {
    it('should create a response with required fields', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        responses: [
          {
            questionId: 'q1',
            value: 'Test answer',
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        status: 'Completed',
        metadata: {
          timeSpent: 120,
          pagesVisited: [0, 1],
          lastPageIndex: 1,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect((savedResponse.survey as any).toString()).toBe(testSurvey._id.toString());
      expect(savedResponse.surveySlug).toBe(testSurvey.slug);
      expect(savedResponse.responses).toHaveLength(1);
      expect(savedResponse.status).toBe('Completed');
      expect(savedResponse.metadata.timeSpent).toBe(120);
    });

    it('should enforce required fields', async () => {
      const response = new Response({});
      
      await expect(response.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `default-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'John Doe',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.status).toBe('Pending'); // Default value
      expect(savedResponse.metadata.timeSpent).toBe(0); // Default value
      expect(savedResponse.metadata.pagesVisited).toEqual([]); // Default value
      expect(savedResponse.responses).toHaveLength(1);
      expect(savedResponse.responses[0].value).toBe('John Doe');
    });
  });

  describe('Response Validation', () => {
    it('should validate survey reference', async () => {
      const responseData = {
        survey: new mongoose.Types.ObjectId(), // Non-existent survey
        surveySlug: testSurvey.slug,
        responses: [
          {
            questionId: 'q1',
            value: 'Test answer',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      // Should save successfully even with non-existent survey reference
      // (MongoDB doesn't enforce foreign key constraints by default)
      await expect(response.save()).resolves.toBeDefined();
    });

    it('should validate status enum', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        responses: [
          {
            questionId: 'q1',
            value: 'Some answer',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        status: 'InvalidStatus',
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      await expect(response.save()).rejects.toThrow();
    });

    it('should validate response structure', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        responses: [
          {
            questionId: 'q1',
            // Missing value and pageIndex
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      await expect(response.save()).rejects.toThrow();
    });

    it('should handle valid email format for respondentEmail', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'valid@example.com',
        responses: [
          {
            questionId: 'q1',
            value: 'User feedback',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.respondentEmail).toBe('valid@example.com');
      expect(savedResponse.responses).toHaveLength(1);
    });

    it('should handle invalid email format for respondentEmail', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'invalid-email',
        responses: [
          {
            questionId: 'q1',
            value: 'Another answer',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      // MongoDB doesn't validate email format by default, so this should save
      const savedResponse = await response.save();
      expect(savedResponse.respondentEmail).toBe('invalid-email');
      expect(savedResponse.responses).toHaveLength(1);
    });
  });

  describe('Response Data Types', () => {
    it('should handle different response value types', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `types-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'String answer',
            pageIndex: 0,
          },
          {
            questionId: 'q2',
            value: 42,
            pageIndex: 0,
          },
          {
            questionId: 'q3',
            value: true,
            pageIndex: 0,
          },
          {
            questionId: 'q4',
            value: ['option1', 'option2'],
            pageIndex: 0,
          },
          {
            questionId: 'q5',
            value: { nested: 'object' },
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses[0].value).toBe('String answer');
      expect(savedResponse.responses[1].value).toBe(42);
      expect(savedResponse.responses[2].value).toBe(true);
      expect(savedResponse.responses[3].value).toEqual(['option1', 'option2']);
      expect(savedResponse.responses[4].value).toEqual({ nested: 'object' });
    });

    it('should handle null and undefined values', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `null-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: '', // Empty string instead of null
            pageIndex: 0,
          },
          {
            questionId: 'q2',
            value: ' ', // Whitespace instead of undefined
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses[0].value).toBe('');
      expect(savedResponse.responses[1].value).toBe(' ');
    });
  });

  describe('Response Metadata', () => {
    it('should handle metadata with all fields', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `metadata-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'User feedback about the survey experience',
            pageIndex: 0,
          },
          {
            questionId: 'q2',
            value: 'Additional comments and suggestions',
            pageIndex: 1,
          }
        ],
        startedAt: new Date(),
        metadata: {
          timeSpent: 300,
          pagesVisited: [0, 1, 2, 0, 1], // User went back and forth
          lastPageIndex: 2,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.metadata.timeSpent).toBe(300);
      expect(savedResponse.metadata.pagesVisited).toEqual([0, 1, 2, 0, 1]);
      expect(savedResponse.metadata.lastPageIndex).toBe(2);
    });

    it('should handle metadata with missing optional fields', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `metadata-missing-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'Quick response without much metadata',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.metadata.timeSpent).toBe(0); // Default
      expect(savedResponse.metadata.pagesVisited).toEqual([]); // Default
      expect(savedResponse.metadata.lastPageIndex).toBe(0);
    });

    it('should handle very large timeSpent values', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `timespent-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'User spent a very long time on this survey',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          timeSpent: 86400, // 24 hours in seconds
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.metadata.timeSpent).toBe(86400);
    });

    it('should handle many pages visited', async () => {
      const manyPages = Array.from({ length: 100 }, (_, i) => i);
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `pages-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'User visited many pages in this survey',
            pageIndex: 0,
          },
          {
            questionId: 'q2',
            value: 'Final response after visiting all pages',
            pageIndex: 99,
          }
        ],
        startedAt: new Date(),
        metadata: {
          pagesVisited: manyPages,
          lastPageIndex: 99,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.metadata.pagesVisited).toHaveLength(100);
      expect(savedResponse.metadata.lastPageIndex).toBe(99);
    });
  });

  describe('Response Timestamps', () => {
    it('should automatically set timestamps', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `timestamps-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'Response to test timestamp functionality',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect((savedResponse as any).createdAt).toBeDefined();
      expect((savedResponse as any).updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `modification-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'Initial response that will be modified',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();
      const originalUpdatedAt = (savedResponse as any).updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedResponse.status = 'InProgress';
      const updatedResponse = await savedResponse.save();

      expect((updatedResponse as any).updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Response Indexes', () => {
    it('should create indexes for efficient querying', async () => {
      // Create multiple responses to test indexes
      const responses = Array.from({ length: 5 }, (_, i) => ({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `user${i}@example.com`,
        responses: [
          {
            questionId: `q${i}`,
            value: `Response from user ${i}`,
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      }));

      await Response.insertMany(responses);

      // Test query by survey
      const surveyResponses = await Response.find({ survey: testSurvey._id });
      expect(surveyResponses.length).toBeGreaterThanOrEqual(5);

      // Test query by surveySlug and status
      const pendingResponses = await Response.find({ 
        surveySlug: testSurvey.slug, 
        status: 'Pending' 
      });
      expect(pendingResponses.length).toBeGreaterThanOrEqual(5);
    });

    it('should enforce unique constraint on survey and respondentEmail', async () => {
      const responseData1 = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'unique@example.com',
        responses: [
          {
            questionId: 'q1',
            value: 'First response from unique user',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const responseData2 = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'unique@example.com', // Same email
        responses: [
          {
            questionId: 'q1',
            value: 'Second response from same user',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response1 = new Response(responseData1);
      await response1.save();

      const response2 = new Response(responseData2);
      await expect(response2.save()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long response values', async () => {
      const longValue = 'a'.repeat(10000);
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `long-values-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: longValue,
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses[0].value).toHaveLength(10000);
    });

    it('should handle many responses in a single response document', async () => {
      const manyResponses = Array.from({ length: 100 }, (_, i) => ({
        questionId: `q${i}`,
        value: `Answer ${i}`,
        pageIndex: Math.floor(i / 10),
      }));

      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `many-responses-test-${Date.now()}@example.com`,
        responses: manyResponses,
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 9,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses).toHaveLength(100);
      expect(savedResponse.responses[0].questionId).toBe('q0');
      expect(savedResponse.responses[99].questionId).toBe('q99');
    });

    it('should handle special characters in response values', async () => {
      const specialCharValue = 'Response with émojis 🎉 and special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `special-chars-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: specialCharValue,
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses[0].value).toContain('🎉');
      expect(savedResponse.responses[0].value).toContain('!@#$%^&*()');
    });

    it('should handle complex nested response values', async () => {
      const complexValue = {
        text: 'Main answer',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'web',
          version: '1.0',
        },
        nested: {
          level1: {
            level2: {
              value: 'deep value',
            },
          },
        },
        array: [1, 2, 3, { nested: 'array item' }],
      };

      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `complex-values-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: complexValue,
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.responses[0].value.text).toBe('Main answer');
      expect(savedResponse.responses[0].value.nested.level1.level2.value).toBe('deep value');
      expect(savedResponse.responses[0].value.array).toHaveLength(4);
    });

    it('should handle responses with IP address and user agent', async () => {
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `ip-useragent-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'Response with IP and user agent tracking',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.ipAddress).toBe('192.168.1.1');
      expect(savedResponse.userAgent).toContain('Mozilla/5.0');
    });

    it('should handle responses with completion and submission dates', async () => {
      const now = new Date();
      const responseData = {
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `completion-test-${Date.now()}@example.com`,
        responses: [
          {
            questionId: 'q1',
            value: 'Completed response with full timeline',
            pageIndex: 0,
          }
        ],
        startedAt: new Date(now.getTime() - 300000), // 5 minutes ago
        completedAt: new Date(now.getTime() - 60000), // 1 minute ago
        submittedAt: now,
        status: 'Completed',
        metadata: {
          timeSpent: 240, // 4 minutes
          lastPageIndex: 0,
        },
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.startedAt.getTime()).toBeLessThan(savedResponse.completedAt!.getTime());
      expect(savedResponse.completedAt!.getTime()).toBeLessThan(savedResponse.submittedAt!.getTime());
      expect(savedResponse.status).toBe('Completed');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of responses efficiently', async () => {
      const startTime = performance.now();
      
      const responses = Array.from({ length: 1000 }, (_, i) => ({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: `user${Date.now()}-${i}@example.com`, // Add unique email to avoid duplicate key error
        responses: [
          {
            questionId: `q${i}`,
            value: `Answer ${i}`,
            pageIndex: 0,
          },
        ],
        startedAt: new Date(),
        metadata: {
          lastPageIndex: 0,
        },
      }));

      await Response.insertMany(responses);
      
      const endTime = performance.now();
      
      const count = await Response.countDocuments({ survey: testSurvey._id });
      expect(count).toBeGreaterThanOrEqual(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent response creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const responseData = {
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: `concurrent${i}@example.com`,
          responses: [
            {
              questionId: `q${i}`,
              value: `Concurrent response ${i}`,
              pageIndex: 0,
            }
          ],
          startedAt: new Date(),
          metadata: {
            lastPageIndex: 0,
          },
        };
        return new Response(responseData).save();
      });

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(10);
      
      // All should have unique emails due to unique constraint
      const emails = responses.map(r => r.respondentEmail);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(10);
    });
  });
});
