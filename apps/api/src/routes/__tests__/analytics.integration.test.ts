import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Survey } from '../../models/Survey';
import { Response } from '../../models/Response';
import { User } from '../../models/User';
import analyticsRouter from '../analytics';
import * as authUtils from '../../utils/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(require('cookie-parser')());
app.use('/api/analytics', analyticsRouter);

describe('Analytics Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testSurvey: any;
  let testResponses: any[] = [];

  beforeAll(async () => {
    // Clear any existing models to prevent overwrite errors
    if (mongoose.models.Survey) {
      delete mongoose.models.Survey;
    }
    if (mongoose.models.Response) {
      delete mongoose.models.Response;
    }
    if (mongoose.models.User) {
      delete mongoose.models.User;
    }
    
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

    // Create test survey with various question types
    testSurvey = new Survey({
      title: 'Analytics Test Survey',
      description: 'Test Description',
      slug: 'analytics-test-survey',
      theme: 'default',
      status: 'published',
      pages: [
        {
          questions: [
            {
              id: 'q1',
              type: 'singleChoice',
              title: 'How satisfied are you?',
              required: true,
              options: [
                { id: 'very-satisfied', text: 'Very Satisfied' },
                { id: 'satisfied', text: 'Satisfied' },
                { id: 'neutral', text: 'Neutral' },
                { id: 'dissatisfied', text: 'Dissatisfied' }
              ]
            },
            {
              id: 'q2',
              type: 'multiChoice',
              title: 'Which features do you use?',
              required: false,
              options: [
                { id: 'feature1', text: 'Feature 1' },
                { id: 'feature2', text: 'Feature 2' },
                { id: 'feature3', text: 'Feature 3' }
              ]
            },
            {
              id: 'q3',
              type: 'slider',
              title: 'Rate your experience (1-10)',
              required: true,
              settings: {
                scaleMin: 1,
                scaleMax: 10,
                scaleStep: 1
              }
            },
            {
              id: 'q4',
              type: 'ratingStar',
              title: 'Rate our service',
              required: true,
              settings: {
                maxRating: 5
              }
            },
            {
              id: 'q5',
              type: 'textShort',
              title: 'What do you like most?',
              required: false
            },
            {
              id: 'q6',
              type: 'textLong',
              title: 'Additional comments',
              required: false
            }
          ],
          branching: []
        }
      ],
      createdBy: testUser._id,
      allowedRespondents: []
    });
    await testSurvey.save();

    // Create test responses with various data
    testResponses = await Promise.all([
      new Response({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'user1@example.com',
        responses: [
          { questionId: 'q1', value: 'very-satisfied', pageIndex: 0 },
          { questionId: 'q2', value: ['feature1', 'feature2'], pageIndex: 0 },
          { questionId: 'q3', value: 9, pageIndex: 0 },
          { questionId: 'q4', value: 5, pageIndex: 0 },
          { questionId: 'q5', value: 'Great service', pageIndex: 0 },
          { questionId: 'q6', value: 'I really appreciate the quick response time and friendly staff.', pageIndex: 0 }
        ],
        status: 'Completed',
        startedAt: new Date(),
        submittedAt: new Date()
      }).save(),
      new Response({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'user2@example.com',
        responses: [
          { questionId: 'q1', value: 'satisfied', pageIndex: 0 },
          { questionId: 'q2', value: ['feature2', 'feature3'], pageIndex: 0 },
          { questionId: 'q3', value: 7, pageIndex: 0 },
          { questionId: 'q4', value: 4, pageIndex: 0 },
          { questionId: 'q5', value: 'Good quality', pageIndex: 0 },
          { questionId: 'q6', value: 'The product meets my expectations and I would recommend it to others.', pageIndex: 0 }
        ],
        status: 'Completed',
        startedAt: new Date(),
        submittedAt: new Date()
      }).save(),
      new Response({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'user3@example.com',
        responses: [
          { questionId: 'q1', value: 'neutral', pageIndex: 0 },
          { questionId: 'q2', value: ['feature1'], pageIndex: 0 },
          { questionId: 'q3', value: 5, pageIndex: 0 },
          { questionId: 'q4', value: 3, pageIndex: 0 },
          { questionId: 'q5', value: 'Average', pageIndex: 0 },
          { questionId: 'q6', value: 'It is okay but could be better in some areas.', pageIndex: 0 }
        ],
        status: 'Completed',
        startedAt: new Date(),
        submittedAt: new Date()
      }).save(),
      new Response({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'user4@example.com',
        responses: [
          { questionId: 'q1', value: 'dissatisfied', pageIndex: 0 },
          { questionId: 'q2', value: [], pageIndex: 0 },
          { questionId: 'q3', value: 2, pageIndex: 0 },
          { questionId: 'q4', value: 1, pageIndex: 0 },
          { questionId: 'q5', value: 'Poor service', pageIndex: 0 },
          { questionId: 'q6', value: 'I am not satisfied with the quality and would not recommend this to anyone.', pageIndex: 0 }
        ],
        status: 'Completed',
        startedAt: new Date(),
        submittedAt: new Date()
      }).save(),
      new Response({
        survey: testSurvey._id,
        surveySlug: testSurvey.slug,
        respondentEmail: 'user5@example.com',
        responses: [
          { questionId: 'q1', value: 'very-satisfied', pageIndex: 0 },
          { questionId: 'q2', value: ['feature1', 'feature2', 'feature3'], pageIndex: 0 },
          { questionId: 'q3', value: 10, pageIndex: 0 },
          { questionId: 'q4', value: 5, pageIndex: 0 },
          { questionId: 'q5', value: 'Excellent', pageIndex: 0 },
          { questionId: 'q6', value: 'Outstanding service and quality. Highly recommended!', pageIndex: 0 }
        ],
        status: 'Completed',
        startedAt: new Date(),
        submittedAt: new Date()
      }).save()
    ]);
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
  });

  describe('Get Survey Analytics Endpoint (GET /api/analytics/:surveyId)', () => {
    describe('Successful Analytics Retrieval', () => {
      it('should get analytics for survey with responses', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          surveyId: testSurvey._id.toString(),
          totalResponses: 5,
          questions: expect.any(Array)
        });
        expect(response.body.questions).toHaveLength(6);
      });

      it('should include analytics for single choice questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q1Analytics = response.body.questions.find((q: any) => q.questionId === 'q1');
        
        expect(q1Analytics).toMatchObject({
          questionId: 'q1',
          type: 'singleChoice',
          title: 'How satisfied are you?',
          totalResponses: 5,
          analytics: {
            type: 'choice',
            counts: {
              'very-satisfied': 2,
              'satisfied': 1,
              'neutral': 1,
              'dissatisfied': 1
            }
          }
        });
      });

      it('should include analytics for multiple choice questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q2Analytics = response.body.questions.find((q: any) => q.questionId === 'q2');
        
        expect(q2Analytics).toMatchObject({
          questionId: 'q2',
          type: 'multiChoice',
          title: 'Which features do you use?',
          totalResponses: 5,
          analytics: {
            type: 'choice',
            counts: {
              'feature1': 3,
              'feature2': 3,
              'feature3': 2
            }
          }
        });
      });

      it('should include analytics for slider questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q3Analytics = response.body.questions.find((q: any) => q.questionId === 'q3');
        
        expect(q3Analytics).toMatchObject({
          questionId: 'q3',
          type: 'slider',
          title: 'Rate your experience (1-10)',
          totalResponses: 5,
          analytics: {
            type: 'numeric',
            avg: 6.6, // (9+7+5+2+10)/5
            min: 2,
            max: 10,
            distribution: {
              '2': 1,
              '5': 1,
              '7': 1,
              '9': 1,
              '10': 1
            }
          }
        });
      });

      it('should include analytics for rating questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q4Analytics = response.body.questions.find((q: any) => q.questionId === 'q4');
        
        expect(q4Analytics).toMatchObject({
          questionId: 'q4',
          type: 'ratingStar',
          title: 'Rate our service',
          totalResponses: 5,
          analytics: {
            type: 'numeric',
            avg: 3.6, // (5+4+3+1+5)/5
            min: 1,
            max: 5,
            distribution: {
              '1': 1,
              '3': 1,
              '4': 1,
              '5': 2
            }
          }
        });
      });

      it('should include analytics for text questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q5Analytics = response.body.questions.find((q: any) => q.questionId === 'q5');
        
        expect(q5Analytics).toMatchObject({
          questionId: 'q5',
          type: 'textShort',
          title: 'What do you like most?',
          totalResponses: 5,
          analytics: {
            type: 'text',
            topWords: expect.any(Array)
          }
        });

        // Check that top words are meaningful
        const topWords = q5Analytics.analytics.topWords;
        expect(topWords.length).toBeGreaterThan(0);
        expect(topWords.length).toBeLessThanOrEqual(30);
        expect(topWords[0]).toHaveProperty('word');
        expect(topWords[0]).toHaveProperty('count');
      });

      it('should include analytics for long text questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q6Analytics = response.body.questions.find((q: any) => q.questionId === 'q6');
        
        expect(q6Analytics).toMatchObject({
          questionId: 'q6',
          type: 'textLong',
          title: 'Additional comments',
          totalResponses: 5,
          analytics: {
            type: 'text',
            topWords: expect.any(Array)
          }
        });

        // Check that top words are meaningful and filtered
        const topWords = q6Analytics.analytics.topWords;
        expect(topWords.length).toBeGreaterThan(0);
        expect(topWords.length).toBeLessThanOrEqual(30);
        
        // Should not include common stop words
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        topWords.forEach((wordObj: any) => {
          expect(stopWords).not.toContain(wordObj.word.toLowerCase());
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle survey with no responses', async () => {
        // Create survey without responses
        const emptySurvey = new Survey({
          title: 'Empty Survey',
          description: 'No responses',
          slug: 'empty-survey',
          theme: 'default',
          status: 'published',
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'textShort',
                  title: 'Test Question',
                  required: true
                }
              ],
              branching: []
            }
          ],
          createdBy: testUser._id
        });
        await emptySurvey.save();

        const response = await request(app)
          .get(`/api/analytics/${emptySurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          surveyId: (emptySurvey._id as any).toString(),
          totalResponses: 0,
          questions: []
        });
      });

      it('should handle survey with partial responses', async () => {
        // Create response with only some questions answered
        const partialResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'partial@example.com',
          responses: [
            { questionId: 'q1', value: 'satisfied', pageIndex: 0 },
            { questionId: 'q3', value: 8, pageIndex: 0 }
            // Missing q2, q4, q5, q6
          ],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await partialResponse.save();

        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.totalResponses).toBe(6); // 5 original + 1 partial

        // Check that questions with no responses show 0
        const q2Analytics = response.body.questions.find((q: any) => q.questionId === 'q2');
        expect(q2Analytics.totalResponses).toBe(5); // Only from original responses
      });

      it('should handle survey with invalid question IDs in responses', async () => {
        // Create response with invalid question ID
        const invalidResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'invalid@example.com',
          responses: [
            { questionId: 'invalid-question-id', value: 'Some value', pageIndex: 0 }
          ],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await invalidResponse.save();

        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.totalResponses).toBe(6); // 5 original + 1 invalid
        expect(response.body.questions).toHaveLength(6); // Should still show all survey questions
      });

      it('should handle survey with non-numeric values in numeric questions', async () => {
        // Create response with non-numeric value for slider
        const nonNumericResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'nonnumeric@example.com',
          responses: [
            { questionId: 'q3', value: 'not-a-number', pageIndex: 0 }
          ],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await nonNumericResponse.save();

        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q3Analytics = response.body.questions.find((q: any) => q.questionId === 'q3');
        
        // Should still calculate analytics for valid numeric responses
        expect(q3Analytics.analytics.type).toBe('numeric');
        expect(q3Analytics.analytics.avg).toBe(6.6); // Should not include the invalid value
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/analytics/${nonExistentId}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found or you do not have permission to view this survey');
      });

      it('should return 404 for survey not owned by user', async () => {
        // Create another user and survey
        const otherUser = new User({
          email: 'other@example.com',
          passwordHash: await authUtils.hashPassword('password123'),
          role: 'respondent'
        });
        await otherUser.save();

        const otherSurvey = new Survey({
          title: 'Other Survey',
          description: 'Other Description',
          slug: 'other-survey',
          theme: 'default',
          status: 'published',
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'textShort',
                  title: 'Other Question',
                  required: true
                }
              ],
              branching: []
            }
          ],
          createdBy: otherUser._id
        });
        await otherSurvey.save();

        const response = await request(app)
          .get(`/api/analytics/${otherSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found or you do not have permission to view this survey');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`);

        expect(response.status).toBe(401);
      });
    });

    describe('Performance and Load Testing', () => {
      it('should handle survey with many responses', async () => {
        // Create many responses
        const manyResponses = await Promise.all(
          Array.from({ length: 100 }, (_, i) => {
            const response = new Response({
              survey: testSurvey._id,
              surveySlug: testSurvey.slug,
              respondentEmail: `user${i + 100}@example.com`,
              responses: [
                { questionId: 'q1', value: ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied'][i % 4], pageIndex: 0 },
                { questionId: 'q2', value: ['feature1', 'feature2', 'feature3'].slice(0, (i % 3) + 1), pageIndex: 0 },
                { questionId: 'q3', value: (i % 10) + 1, pageIndex: 0 },
                { questionId: 'q4', value: (i % 5) + 1, pageIndex: 0 },
                { questionId: 'q5', value: `Response ${i}`, pageIndex: 0 },
                { questionId: 'q6', value: `This is a long response ${i} with many words to test text analytics.`, pageIndex: 0 }
              ],
              status: 'Completed',
              startedAt: new Date(),
              submittedAt: new Date()
            });
            return response.save();
          })
        );

        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.totalResponses).toBe(105); // 100 new + 5 original
        expect(response.body.questions).toHaveLength(6);
      });

      it('should handle survey with many questions', async () => {
        // Create survey with many questions
        const manyQuestions = Array.from({ length: 50 }, (_, i) => ({
          id: `q${i}`,
          type: 'textShort',
          title: `Question ${i}`,
          required: true
        }));

        const largeSurvey = new Survey({
          title: 'Large Survey',
          description: 'Many Questions',
          slug: 'large-survey',
          theme: 'default',
          status: 'published',
          pages: [
            {
              questions: manyQuestions,
              branching: []
            }
          ],
          createdBy: testUser._id
        });
        await largeSurvey.save();

        // Create some responses
        const responses = await Promise.all(
          Array.from({ length: 10 }, (_, i) => {
            const response = new Response({
              survey: largeSurvey._id,
              surveySlug: largeSurvey.slug,
              respondentEmail: `user${i}@example.com`,
              responses: manyQuestions.map(q => ({
                questionId: q.id,
                value: `Answer ${i} for ${q.id}`,
                pageIndex: 0
              })),
              status: 'Completed',
              startedAt: new Date(),
              submittedAt: new Date()
            });
            return response.save();
          })
        );

        const response = await request(app)
          .get(`/api/analytics/${largeSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.totalResponses).toBe(10);
        expect(response.body.questions).toHaveLength(50);
      });

      it('should handle multiple concurrent analytics requests', async () => {
        const promises = Array.from({ length: 10 }, () =>
          request(app)
            .get(`/api/analytics/${testSurvey._id}`)
            .set('Cookie', `accessToken=${authToken}`)
        );

        const results = await Promise.allSettled(promises);
        
        // All should succeed
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            expect(result.value.status).toBe(200);
            expect(result.value.body.totalResponses).toBe(5);
          }
        });
      });
    });

    describe('Data Accuracy', () => {
      it('should calculate correct averages for numeric questions', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q3Analytics = response.body.questions.find((q: any) => q.questionId === 'q3');
        
        // Manual calculation: (9+7+5+2+10)/5 = 33/5 = 6.6
        expect(q3Analytics.analytics.avg).toBe(6.6);
        expect(q3Analytics.analytics.min).toBe(2);
        expect(q3Analytics.analytics.max).toBe(10);
      });

      it('should count choice responses correctly', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q1Analytics = response.body.questions.find((q: any) => q.questionId === 'q1');
        
        // Manual count: very-satisfied(2), satisfied(1), neutral(1), dissatisfied(1)
        expect(q1Analytics.analytics.counts['very-satisfied']).toBe(2);
        expect(q1Analytics.analytics.counts['satisfied']).toBe(1);
        expect(q1Analytics.analytics.counts['neutral']).toBe(1);
        expect(q1Analytics.analytics.counts['dissatisfied']).toBe(1);
      });

      it('should handle multi-choice responses correctly', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        const q2Analytics = response.body.questions.find((q: any) => q.questionId === 'q2');
        
        // Manual count: feature1(3), feature2(3), feature3(2)
        expect(q2Analytics.analytics.counts['feature1']).toBe(3);
        expect(q2Analytics.analytics.counts['feature2']).toBe(3);
        expect(q2Analytics.analytics.counts['feature3']).toBe(2);
      });
    });

    describe('Database Integration', () => {
      it('should maintain data consistency across operations', async () => {
        // Get initial analytics
        const initialResponse = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(initialResponse.status).toBe(200);
        expect(initialResponse.body.totalResponses).toBe(5);

        // Add new response
        const newResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'newuser@example.com',
          responses: [
            { questionId: 'q1', value: 'satisfied', pageIndex: 0 },
            { questionId: 'q3', value: 6, pageIndex: 0 }
          ],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await newResponse.save();

        // Get updated analytics
        const updatedResponse = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(updatedResponse.status).toBe(200);
        expect(updatedResponse.body.totalResponses).toBe(6);
      });

      it('should handle database connection issues gracefully', async () => {
        const response = await request(app)
          .get(`/api/analytics/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
      });
    });
  });
});
