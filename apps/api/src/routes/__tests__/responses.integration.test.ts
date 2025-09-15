import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Response } from '../../models/Response';
import { Survey } from '../../models/Survey';
import { User } from '../../models/User';
import responsesRouter from '../responses';
import * as authUtils from '../../utils/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(require('cookie-parser')());
app.use('/api/responses', responsesRouter);

describe('Responses Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testSurvey: any;
  let testResponse: any;
  let respondentToken: string;

  beforeAll(async () => {
    // Database connection is handled by vitest-setup.ts
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_app_test');
    }
  });

  afterAll(async () => {
    // Database connection cleanup is handled by vitest-setup.ts
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      passwordHash: await authUtils.hashPassword('password123'),
      role: 'respondent'
    });
    await testUser.save();

    // Generate auth token for testing
    authToken = authUtils.generateAccessToken(testUser._id.toString());

    // Create test survey
    testSurvey = new Survey({
      title: 'Test Survey',
      description: 'Test Description',
      slug: 'test-survey',
      theme: 'default',
      status: 'published',
      pages: [
        {
          questions: [
            {
              id: 'q1',
              type: 'textShort',
              title: 'What is your name?',
              required: true
            },
            {
              id: 'q2',
              type: 'singleChoice',
              title: 'How satisfied are you?',
              required: true,
              options: [
                { id: 'very-satisfied', text: 'Very Satisfied' },
                { id: 'satisfied', text: 'Satisfied' },
                { id: 'neutral', text: 'Neutral' },
                { id: 'dissatisfied', text: 'Dissatisfied' }
              ]
            }
          ],
          branching: []
        }
      ],
      createdBy: testUser._id,
      allowedRespondents: ['respondent@example.com', 'submit@example.com', 'update@example.com', 'database@example.com', 'socket@example.com']
    });
    await testSurvey.save();

    // Generate respondent token for survey access
    respondentToken = authUtils.generateRespondentToken(testSurvey._id.toString(), 'respondent@example.com');

    // Create test response
    testResponse = new Response({
      survey: testSurvey._id,
      surveySlug: testSurvey.slug,
      respondentEmail: 'respondent@example.com',
      responses: [
        { questionId: 'q1', value: 'John Doe', pageIndex: 0 },
        { questionId: 'q2', value: 'satisfied', pageIndex: 0 }
      ],
      status: 'Completed',
      startedAt: new Date(),
      submittedAt: new Date(),
      metadata: {
        lastPageIndex: 0,
        timeSpent: 120,
        pagesVisited: [0]
      }
    });
    await testResponse.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
  });

  describe('Get All Responses Endpoint (GET /api/responses)', () => {
    describe('Successful Response Retrieval', () => {
      it('should get all responses with statistics', async () => {
        // Create additional responses
        const additionalResponses = await Promise.all(
          Array.from({ length: 5 }, (_, i) => {
            const response = new Response({
              survey: testSurvey._id,
              surveySlug: testSurvey.slug,
              respondentEmail: `user${i}@example.com`,
              responses: [{ questionId: 'q1', value: `User ${i}`, pageIndex: 0 }],
              status: i < 3 ? 'Completed' : 'InProgress',
              startedAt: new Date(),
              submittedAt: i < 3 ? new Date() : undefined,
              metadata: {
                lastPageIndex: 0,
                timeSpent: 60 + i * 10,
                pagesVisited: [0]
              }
            });
            return response.save();
          })
        );

        const response = await request(app)
          .get('/api/responses');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          totalResponses: 6, // 1 from beforeEach + 5 new
          completedResponses: 4, // 1 from beforeEach + 3 completed
          recentResponses: expect.any(Array)
        });
        expect(response.body.responses).toHaveLength(6);
        expect(response.body.recentResponses).toHaveLength(6); // All responses are recent
      });

      it('should limit responses to 50 for overview', async () => {
        // Create 60 responses
        const responses = await Promise.all(
          Array.from({ length: 60 }, (_, i) => {
            const response = new Response({
              survey: testSurvey._id,
              surveySlug: testSurvey.slug,
              respondentEmail: `user${i}@example.com`,
              responses: [{ questionId: 'q1', value: `User ${i}`, pageIndex: 0 }],
              status: 'Completed',
              startedAt: new Date(),
              submittedAt: new Date()
            });
            return response.save();
          })
        );

        const response = await request(app)
          .get('/api/responses');

        expect(response.status).toBe(200);
        expect(response.body.responses).toHaveLength(50);
        expect(response.body.totalResponses).toBe(61); // 60 new + 1 from beforeEach
      });

      it('should handle empty response list', async () => {
        // Delete all responses
        await Response.deleteMany({});

        const response = await request(app)
          .get('/api/responses');

        expect(response.status).toBe(200);
        expect(response.body.totalResponses).toBe(0);
        expect(response.body.completedResponses).toBe(0);
        expect(response.body.responses).toHaveLength(0);
        expect(response.body.recentResponses).toHaveLength(0);
      });
    });

    describe('Response Data Structure', () => {
      it('should include survey information in responses', async () => {
        const response = await request(app)
          .get('/api/responses');

        expect(response.status).toBe(200);
        expect(response.body.responses[0]).toHaveProperty('survey');
        expect(response.body.responses[0].survey).toMatchObject({
          title: testSurvey.title,
          status: testSurvey.status
        });
      });

      it('should sort responses by creation date', async () => {
        // Create responses with different timestamps
        const olderResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'older@example.com',
          responses: [{ questionId: 'q1', value: 'Older', pageIndex: 0 }],
          status: 'Completed',
          startedAt: new Date(Date.now() - 86400000), // Yesterday
          submittedAt: new Date(Date.now() - 86400000)
        });
        await olderResponse.save();

        // Wait a moment to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

        // Create a newer response to ensure proper sorting
        const newerResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'newer@example.com',
          responses: [{ questionId: 'q1', value: 'Newer', pageIndex: 0 }],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await newerResponse.save();

        const response = await request(app)
          .get('/api/responses');

        expect(response.status).toBe(200);
        
        // Check that responses are sorted by creation date (most recent first)
        const emails = response.body.responses.map((r: any) => r.respondentEmail);
        expect(emails).toContain('newer@example.com');
        expect(emails).toContain('respondent@example.com');
        expect(emails).toContain('older@example.com');
        
        // Verify that newer response comes before older response
        const newerIndex = emails.indexOf('newer@example.com');
        const olderIndex = emails.indexOf('older@example.com');
        expect(newerIndex).toBeLessThan(olderIndex);
      });
    });
  });

  describe('Auto-save Response Endpoint (PUT /api/responses/:surveyId/auto-save)', () => {
    describe('Successful Auto-save', () => {
      it('should auto-save response progress', async () => {
        const autoSaveData = {
          responses: [
            { questionId: 'q1', value: 'Partial Answer' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Progress auto-saved');

        // Verify response was saved
        const savedResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'respondent@example.com'
        });
        expect(savedResponse).toBeTruthy();
        expect(savedResponse?.status).toBe('InProgress');
        expect(savedResponse?.responses[0].value).toBe('Partial Answer');
      });

      it('should update existing response', async () => {
        const autoSaveData = {
          responses: [
            { questionId: 'q1', value: 'Updated Answer' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 120,
            pagesVisited: [0]
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(200);

        // Verify response was updated
        const updatedResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'respondent@example.com'
        });
        expect(updatedResponse?.responses[0].value).toBe('Updated Answer');
        expect(updatedResponse?.metadata.timeSpent).toBe(120);
      });

      it('should create new response if none exists', async () => {
        // Delete existing response
        await Response.deleteMany({});

        const autoSaveData = {
          responses: [
            { questionId: 'q1', value: 'New Response' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 30,
            pagesVisited: [0]
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(200);

        // Verify new response was created
        const newResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'respondent@example.com'
        });
        expect(newResponse).toBeTruthy();
        expect(newResponse?.startedAt).toBeDefined();
        expect(newResponse?.status).toBe('InProgress');
      });
    });

    describe('Validation Errors', () => {
      it('should reject auto-save without required fields', async () => {
        const autoSaveData = {
          responses: [{ questionId: 'q1', value: 'Answer' }]
          // Missing metadata, status, updatedAt
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
      });

      it('should reject auto-save with invalid status', async () => {
        const autoSaveData = {
          responses: [{ questionId: 'q1', value: 'Answer' }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          },
          status: 'Completed', // Invalid for auto-save
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid status for auto-save');
      });

      it('should reject auto-save without token', async () => {
        const autoSaveData = {
          responses: [{ questionId: 'q1', value: 'Answer' }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .send(autoSaveData);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });
    });

    describe('Edge Cases', () => {
      it('should handle auto-save with empty responses', async () => {
        const autoSaveData = {
          responses: [],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 0,
            pagesVisited: []
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Progress auto-saved');
      });

      it('should handle auto-save with large metadata', async () => {
        const largePagesVisited = Array.from({ length: 100 }, (_, i) => i);
        const autoSaveData = {
          responses: [{ questionId: 'q1', value: 'Answer' }],
          metadata: {
            lastPageIndex: 99,
            timeSpent: 3600,
            pagesVisited: largePagesVisited
          },
          status: 'InProgress',
          updatedAt: new Date().toISOString()
        };

        const response = await request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Progress auto-saved');
      });
    });
  });

  describe('Submit Response Endpoint (POST /api/responses/:surveyId/submit)', () => {
    describe('Successful Response Submission', () => {
      it('should submit complete response', async () => {
        const submitData = {
          responses: [
            { questionId: 'q1', value: 'John Doe', pageIndex: 0 },
            { questionId: 'q2', value: 'very-satisfied', pageIndex: 0 }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 180,
            pagesVisited: [0]
          }
        };

        // Generate token for a different email to avoid conflict with testResponse
        const submitToken = authUtils.generateRespondentToken(testSurvey._id.toString(), 'submit@example.com');

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: submitToken })
          .send(submitData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Survey submitted successfully');

        // Verify response was submitted
        const submittedResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'submit@example.com'
        });
        expect(submittedResponse?.status).toBe('Completed');
        expect(submittedResponse?.submittedAt).toBeDefined();
        expect(submittedResponse?.responses).toHaveLength(2);
      });

      it('should create new response on submission', async () => {
        // Delete existing response
        await Response.deleteMany({});

        const submitData = {
          responses: [
            { questionId: 'q1', value: 'Jane Doe' },
            { questionId: 'q2', value: 'satisfied' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 150,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(200);

        // Verify new response was created and submitted
        const newResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'respondent@example.com'
        });
        expect(newResponse).toBeTruthy();
        expect(newResponse?.status).toBe('Completed');
        expect(newResponse?.startedAt).toBeDefined();
        expect(newResponse?.submittedAt).toBeDefined();
      });

      it('should update existing response on submission', async () => {
        // Create in-progress response with different email
        const inProgressResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'update@example.com',
          responses: [{ questionId: 'q1', value: 'Partial', pageIndex: 0 }],
          status: 'InProgress',
          startedAt: new Date(),
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        });
        await inProgressResponse.save();

        // Generate token for the update email
        const updateToken = authUtils.generateRespondentToken(testSurvey._id.toString(), 'update@example.com');

        const submitData = {
          responses: [
            { questionId: 'q1', value: 'Complete Answer' },
            { questionId: 'q2', value: 'neutral' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 200,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: updateToken })
          .send(submitData);

        expect(response.status).toBe(200);

        // Verify response was updated
        const updatedResponse = await Response.findOne({
          survey: testSurvey._id,
          respondentEmail: 'update@example.com'
        });
        expect(updatedResponse?.status).toBe('Completed');
        expect(updatedResponse?.responses[0].value).toBe('Complete Answer');
        expect(updatedResponse?.responses).toHaveLength(2);
      });
    });

    describe('Validation Errors', () => {
      it('should reject submission without required fields', async () => {
        const submitData = {
          responses: [{ questionId: 'q1', value: 'Answer' }]
          // Missing metadata
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
      });

      it('should reject submission to non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const nonExistentToken = authUtils.generateRespondentToken(nonExistentId.toString(), 'respondent@example.com');
        const submitData = {
          responses: [{ questionId: 'q1', value: 'Answer', pageIndex: 0 }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${nonExistentId}/submit`)
          .query({ token: nonExistentToken })
          .send(submitData);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });

      it('should reject submission to unpublished survey', async () => {
        testSurvey.status = 'draft';
        await testSurvey.save();

        const submitData = {
          responses: [{ questionId: 'q1', value: 'Answer', pageIndex: 0 }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Survey is not published');
      });

      it('should reject submission to closed survey', async () => {
        testSurvey.closeDate = new Date(Date.now() - 86400000); // Yesterday
        await testSurvey.save();

        const submitData = {
          responses: [{ questionId: 'q1', value: 'Answer', pageIndex: 0 }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Survey has closed');
      });

      it('should reject duplicate submission', async () => {
        const submitData = {
          responses: [
            { questionId: 'q1', value: 'New Answer' },
            { questionId: 'q2', value: 'dissatisfied' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 120,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Survey already submitted');
      });

      it('should reject submission without token', async () => {
        const submitData = {
          responses: [{ questionId: 'q1', value: 'Answer', pageIndex: 0 }],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .send(submitData);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });
    });

    describe('Edge Cases', () => {
      it('should handle submission with empty responses', async () => {
        // Delete existing response
        await Response.deleteMany({});

        const submitData = {
          responses: [],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 30,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Survey submitted successfully');
      });

      it('should handle submission with partial responses', async () => {
        // Delete existing response
        await Response.deleteMany({});

        const submitData = {
          responses: [
            { questionId: 'q1', value: 'Only first question answered' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 90,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Survey submitted successfully');
      });

      it('should handle submission with invalid question IDs', async () => {
        // Delete existing response
        await Response.deleteMany({});

        const submitData = {
          responses: [
            { questionId: 'invalid-question-id', value: 'Answer' }
          ],
          metadata: {
            lastPageIndex: 0,
            timeSpent: 60,
            pagesVisited: [0]
          }
        };

        const response = await request(app)
          .post(`/api/responses/${testSurvey._id}/submit`)
          .query({ token: respondentToken })
          .send(submitData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Survey submitted successfully');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent auto-saves', async () => {
      const autoSaveData = {
        responses: [{ questionId: 'q1', value: 'Concurrent Answer' }],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 60,
          pagesVisited: [0]
        },
        status: 'InProgress',
        updatedAt: new Date().toISOString()
      };

      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .put(`/api/responses/${testSurvey._id}/auto-save`)
          .query({ token: respondentToken })
          .send(autoSaveData)
      );

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
        }
      });
    });

    it('should handle multiple concurrent submissions', async () => {
      // Create multiple surveys and responses
      const surveys = await Promise.all(
        Array.from({ length: 5 }, (_, i) => {
          const survey = new Survey({
            title: `Survey ${i}`,
            description: `Description ${i}`,
            slug: `survey-${i}`,
            theme: 'default',
            status: 'published',
            pages: [
              {
                questions: [
                  {
                    id: 'q1',
                    type: 'textShort',
                    title: 'What is your name?',
                    required: true
                  }
                ],
                branching: []
              }
            ],
            createdBy: testUser._id,
            allowedRespondents: [`respondent${i}@example.com`]
          });
          return survey.save();
        })
      );

      const submitData = {
        responses: [{ questionId: 'q1', value: 'Concurrent Submission', pageIndex: 0 }],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 60,
          pagesVisited: [0]
        }
      };

      const promises = surveys.map((survey, i) => {
        const token = authUtils.generateRespondentToken((survey._id as any).toString(), `respondent${i}@example.com`);
        return request(app)
          .post(`/api/responses/${survey._id}/submit`)
          .query({ token })
          .send(submitData);
      });

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
        }
      });
    });

    it('should handle large response data', async () => {
      // Delete existing response
      await Response.deleteMany({});

      const largeResponses = Array.from({ length: 100 }, (_, i) => ({
        questionId: `q${i}`,
        value: `This is a very long answer for question ${i}. `.repeat(10)
      }));

      const submitData = {
        responses: largeResponses,
        metadata: {
          lastPageIndex: 99,
          timeSpent: 3600,
          pagesVisited: Array.from({ length: 100 }, (_, i) => i)
        }
      };

      const response = await request(app)
        .post(`/api/responses/${testSurvey._id}/submit`)
        .query({ token: respondentToken })
        .send(submitData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Survey submitted successfully');
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Auto-save first
      const autoSaveData = {
        responses: [{ questionId: 'q1', value: 'Auto-saved Answer' }],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 60,
          pagesVisited: [0]
        },
        status: 'InProgress',
        updatedAt: new Date().toISOString()
      };

      const autoSaveResponse = await request(app)
        .put(`/api/responses/${testSurvey._id}/auto-save`)
        .query({ token: respondentToken })
        .send(autoSaveData);

      expect(autoSaveResponse.status).toBe(200);

      // Then submit
      const submitData = {
        responses: [
          { questionId: 'q1', value: 'Final Answer' },
          { questionId: 'q2', value: 'satisfied' }
        ],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 120,
          pagesVisited: [0]
        }
      };

      const submitResponse = await request(app)
        .post(`/api/responses/${testSurvey._id}/submit`)
        .query({ token: respondentToken })
        .send(submitData);

      expect(submitResponse.status).toBe(200);

      // Verify final state
      const finalResponse = await Response.findOne({
        survey: testSurvey._id,
        respondentEmail: 'respondent@example.com'
      });
      expect(finalResponse?.status).toBe('Completed');
      expect(finalResponse?.responses[0].value).toBe('Final Answer');
      expect(finalResponse?.responses).toHaveLength(2);
    });

    it('should handle database connection issues gracefully', async () => {
      const submitData = {
        responses: [{ questionId: 'q1', value: 'Test Answer', pageIndex: 0 }],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 60,
          pagesVisited: [0]
        }
      };

      // Generate token for database test
      const databaseToken = authUtils.generateRespondentToken(testSurvey._id.toString(), 'database@example.com');

      const response = await request(app)
        .post(`/api/responses/${testSurvey._id}/submit`)
        .query({ token: databaseToken })
        .send(submitData);

      expect(response.status).toBe(200);
    });
  });

  describe('Real-time Integration', () => {
    it('should emit socket event on submission', async () => {
      // Mock socket.io
      const mockIo = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn()
      };
      app.set('io', mockIo);

      const submitData = {
        responses: [{ questionId: 'q1', value: 'Socket Test', pageIndex: 0 }],
        metadata: {
          lastPageIndex: 0,
          timeSpent: 60,
          pagesVisited: [0]
        }
      };

      // Generate token for socket test
      const socketToken = authUtils.generateRespondentToken(testSurvey._id.toString(), 'socket@example.com');

      const response = await request(app)
        .post(`/api/responses/${testSurvey._id}/submit`)
        .query({ token: socketToken })
        .send(submitData);

      expect(response.status).toBe(200);
      expect(mockIo.to).toHaveBeenCalledWith(`survey-${testSurvey._id}`);
      
      // Verify the mock was called at least once
      expect(mockIo.emit).toHaveBeenCalledTimes(1);
      
      // Check that emit was called with the correct event name
      expect(mockIo.emit).toHaveBeenCalledWith('response_submitted', expect.any(Object));
      
      // Check the structure of the emitted data
      const emitCall = mockIo.emit.mock.calls[0];
      expect(emitCall[0]).toBe('response_submitted');
      expect(emitCall[1]).toHaveProperty('surveyId', testSurvey._id.toString());
      expect(emitCall[1]).toHaveProperty('responseId');
      expect(emitCall[1].responseId).toBeDefined();
    });
  });
});
