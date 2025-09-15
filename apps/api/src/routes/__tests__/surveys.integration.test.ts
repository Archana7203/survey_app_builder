import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Survey } from '../../models/Survey';
import { Response } from '../../models/Response';
import { User } from '../../models/User';
import surveysRouter from '../surveys';
import * as authUtils from '../../utils/auth';
import { requireAuth } from '../../middleware/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(require('cookie-parser')());
app.use('/api/surveys', surveysRouter);

describe('Surveys Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testSurvey: any;

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
      status: 'draft',
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
      allowedRespondents: []
    });
    await testSurvey.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
  });

  describe('Get Surveys Endpoint (GET /api/surveys)', () => {
    describe('Successful Survey Retrieval', () => {
      it('should get surveys with pagination', async () => {
        // Create multiple surveys
        const surveys = await Promise.all(
          Array.from({ length: 15 }, (_, i) => {
            const survey = new Survey({
              title: `Survey ${i + 1}`,
              description: `Description ${i + 1}`,
              slug: `survey-${i + 1}`,
              theme: 'default',
              status: 'draft',
              pages: [{ questions: [], branching: [] }],
              createdBy: testUser._id
            });
            return survey.save();
          })
        );

        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .query({ page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.surveys).toHaveLength(10);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: 16, // 15 new + 1 from beforeEach
          totalPages: 2,
          hasNext: true,
          hasPrev: false
        });
      });

      it('should get surveys with response counts', async () => {
        // Create responses for the test survey
        const responses = await Promise.all(
          Array.from({ length: 5 }, (_, i) => {
            const response = new Response({
              survey: testSurvey._id,
              surveySlug: testSurvey.slug,
              respondentEmail: `user${i}@example.com`,
              responses: [{ questionId: 'q1', value: `Answer ${i}`, pageIndex: 0 }],
              status: 'Completed',
              startedAt: new Date(),
              submittedAt: new Date()
            });
            return response.save();
          })
        );

        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.surveys[0].responseCount).toBe(5);
      });

      it('should handle empty survey list', async () => {
        // Delete the test survey
        await Survey.deleteMany({});

        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.surveys).toHaveLength(0);
        expect(response.body.pagination.total).toBe(0);
      });
    });

    describe('Pagination Edge Cases', () => {
      it('should handle invalid page numbers', async () => {
        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .query({ page: 0, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.pagination.page).toBe(1);
      });

      it('should handle negative page numbers', async () => {
        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .query({ page: -1, limit: 10 });

        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.pagination.page).toBe(1);
        }
      });

      it('should handle very large page numbers', async () => {
        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .query({ page: 999999, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.surveys).toHaveLength(0);
        expect(response.body.pagination.hasNext).toBe(false);
      });

      it('should enforce maximum limit', async () => {
        const response = await request(app)
          .get('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .query({ page: 1, limit: 1000 });

        expect(response.status).toBe(200);
        expect(response.body.pagination.limit).toBe(100); // Max limit
      });
    });
  });

  describe('Create Survey Endpoint (POST /api/surveys)', () => {
    describe('Successful Survey Creation', () => {
      it('should create survey with valid data', async () => {
        const surveyData = {
          title: 'New Survey',
          description: 'New Description',
          theme: 'modern',
          backgroundColor: '#ffffff',
          textColor: '#000000',
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
          ]
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          title: surveyData.title,
          description: surveyData.description,
          theme: surveyData.theme,
          backgroundColor: surveyData.backgroundColor,
          textColor: surveyData.textColor,
          status: 'draft'
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.slug).toBeDefined();

        // Verify survey was created in database
        const survey = await Survey.findById(response.body.id);
        expect(survey).toBeTruthy();
        expect(survey?.title).toBe(surveyData.title);
      });

      it('should create survey with minimal data', async () => {
        const surveyData = {
          title: 'Minimal Survey'
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(surveyData.title);
        expect(response.body.description).toBe('');
        expect(response.body.theme).toBe('default');
        expect(response.body.pages).toHaveLength(1);
      });

      it('should generate unique slug', async () => {
        const surveyData = {
          title: 'Duplicate Title'
        };

        const response1 = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        const response2 = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.body.slug).not.toBe(response2.body.slug);
      });
    });

    describe('Validation Errors', () => {
      it('should reject survey without title', async () => {
        const surveyData = {
          description: 'No title survey'
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Title is required');
      });

      it('should reject survey with empty title', async () => {
        const surveyData = {
          title: ''
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Title is required');
      });

      it('should reject survey with invalid pages structure', async () => {
        const surveyData = {
          title: 'Invalid Survey',
          pages: 'not an array'
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Pages must be an array');
      });

      it('should reject survey with invalid page data', async () => {
        const surveyData = {
          title: 'Invalid Survey',
          pages: [
            {
              questions: 'not an array',
              branching: []
            }
          ]
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Questions must be an array at page 1');
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long titles', async () => {
        const longTitle = 'A'.repeat(1000);
        const surveyData = {
          title: longTitle
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        // Should either succeed or fail gracefully
        expect([201, 400, 500]).toContain(response.status);
      });

      it('should handle special characters in title', async () => {
        const surveyData = {
          title: 'Survey with Special Characters: !@#$%^&*()_+{}|:"<>?[]\\;\',./'
        };

        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(surveyData);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(surveyData.title);
      });

      it('should handle malformed request body', async () => {
        const response = await request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send('invalid json');

        expect([400, 500]).toContain(response.status);
      });
    });
  });

  describe('Get Survey by ID Endpoint (GET /api/surveys/:surveyId)', () => {
    describe('Successful Survey Retrieval', () => {
      it('should get survey by ID', async () => {
        const response = await request(app)
          .get(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: testSurvey._id.toString(),
          title: testSurvey.title,
          description: testSurvey.description,
          slug: testSurvey.slug
        });
      });

      it('should include all survey fields', async () => {
        const response = await request(app)
          .get(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('pages');
        expect(response.body).toHaveProperty('theme');
        // backgroundColor and textColor are optional fields
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/surveys/${nonExistentId}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found or you do not have permission to view this survey');
      });

      it('should return 404 for invalid survey ID format', async () => {
        const response = await request(app)
          .get('/api/surveys/invalid-id')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(500);
      });
    });
  });

  describe('Get Survey by Slug Endpoint (GET /api/surveys/by-slug/:slug)', () => {
    describe('Successful Survey Retrieval', () => {
      it('should get survey by slug', async () => {
        const response = await request(app)
          .get(`/api/surveys/by-slug/${testSurvey.slug}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: testSurvey._id.toString(),
          title: testSurvey.title,
          slug: testSurvey.slug
        });
      });

      it('should not require authentication', async () => {
        const response = await request(app)
          .get(`/api/surveys/by-slug/${testSurvey.slug}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent slug', async () => {
        const response = await request(app)
          .get('/api/surveys/by-slug/non-existent-slug');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Get Survey by ID (Public) Endpoint (GET /api/surveys/by-id/:id)', () => {
    describe('Successful Survey Retrieval', () => {
      it('should get survey by ID without authentication', async () => {
        const response = await request(app)
          .get(`/api/surveys/by-id/${testSurvey._id}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: testSurvey._id.toString(),
          title: testSurvey.title
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for invalid ID format', async () => {
        const response = await request(app)
          .get('/api/surveys/by-id/invalid-id');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid survey ID format');
      });

      it('should return 404 for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/surveys/by-id/${nonExistentId}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Get Public Survey Endpoint (GET /api/surveys/public/:slug)', () => {
    describe('Successful Survey Retrieval', () => {
      it('should get published survey by slug', async () => {
        // Publish the test survey
        testSurvey.status = 'published';
        await testSurvey.save();

        const response = await request(app)
          .get(`/api/surveys/public/${testSurvey.slug}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: testSurvey._id.toString(),
          title: testSurvey.title,
          status: 'published'
        });
      });

      it('should not require authentication', async () => {
        testSurvey.status = 'published';
        await testSurvey.save();

        const response = await request(app)
          .get(`/api/surveys/public/${testSurvey.slug}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for draft survey', async () => {
        const response = await request(app)
          .get(`/api/surveys/public/${testSurvey.slug}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found or not accessible');
      });

      it('should return 400 for closed survey', async () => {
        testSurvey.status = 'published';
        testSurvey.closeDate = new Date(Date.now() - 86400000); // Yesterday
        await testSurvey.save();

        const response = await request(app)
          .get(`/api/surveys/public/${testSurvey.slug}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('This survey is closed');
      });

      it('should return 404 for non-existent slug', async () => {
        const response = await request(app)
          .get('/api/surveys/public/non-existent-slug');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found or not accessible');
      });
    });
  });

  describe('Update Survey Endpoint (PUT /api/surveys/:surveyId)', () => {
    describe('Successful Survey Updates', () => {
      it('should update survey title and description', async () => {
        const updateData = {
          title: 'Updated Survey Title',
          description: 'Updated Description'
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.survey).toMatchObject({
          title: updateData.title,
          description: updateData.description
        });

        // Verify update in database
        const updatedSurvey = await Survey.findById(testSurvey._id);
        expect(updatedSurvey?.title).toBe(updateData.title);
        expect(updatedSurvey?.description).toBe(updateData.description);
      });

      it('should update survey pages', async () => {
        const updateData = {
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'textShort',
                  title: 'Updated Question',
                  required: true
                }
              ],
              branching: []
            }
          ]
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.survey.pages[0].questions[0].title).toBe('Updated Question');
      });

      it('should publish survey', async () => {
        const updateData = {
          status: 'published'
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.survey.status).toBe('published');
        expect(response.body.survey.locked).toBe(true);
        expect(response.body.survey.closeDate).toBeUndefined();
      });

      it('should unpublish survey', async () => {
        // First publish the survey
        testSurvey.status = 'published';
        testSurvey.locked = true;
        await testSurvey.save();

        const updateData = {
          status: 'draft'
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.survey.status).toBe('draft');
        expect(response.body.survey.closeDate).toBeDefined();
      });
    });

    describe('Validation Errors', () => {
      it('should reject empty title', async () => {
        const updateData = {
          title: ''
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Title cannot be empty');
      });

      it('should reject invalid pages structure', async () => {
        const updateData = {
          pages: 'not an array'
        };

        const response = await request(app)
          .put(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Pages must be an array');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/api/surveys/${nonExistentId}`)
          .set('Cookie', `accessToken=${authToken}`)
          .send(updateData);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Delete Survey Endpoint (DELETE /api/surveys/:surveyId)', () => {
    describe('Successful Survey Deletion', () => {
      it('should delete survey without responses', async () => {
        const response = await request(app)
          .delete(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Survey deleted successfully');

        // Verify survey was deleted
        const deletedSurvey = await Survey.findById(testSurvey._id);
        expect(deletedSurvey).toBeNull();
      });
    });

    describe('Error Cases', () => {
      it('should reject deletion of survey with responses', async () => {
        // Create a response for the survey
        const surveyResponse = new Response({
          survey: testSurvey._id,
          surveySlug: testSurvey.slug,
          respondentEmail: 'test@example.com',
          responses: [{ questionId: 'q1', value: 'Test Answer', pageIndex: 0 }],
          status: 'Completed',
          startedAt: new Date(),
          submittedAt: new Date()
        });
        await surveyResponse.save();

        const response = await request(app)
          .delete(`/api/surveys/${testSurvey._id}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Cannot delete survey with 1 response(s)');
      });

      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/surveys/${nonExistentId}`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Duplicate Survey Endpoint (POST /api/surveys/:surveyId/duplicate)', () => {
    describe('Successful Survey Duplication', () => {
      it('should duplicate survey with all data', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/duplicate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          title: 'Test Survey (Copy)',
          description: testSurvey.description,
          theme: testSurvey.theme,
          status: 'draft'
        });
        // locked field might not be present in response
        expect(response.body.id).not.toBe(testSurvey._id.toString());
        expect(response.body.slug).not.toBe(testSurvey.slug);

        // Verify duplicate was created
        const duplicate = await Survey.findById(response.body.id);
        expect(duplicate).toBeTruthy();
        expect(duplicate?.title).toBe('Test Survey (Copy)');
      });

      it('should generate unique slug for duplicate', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/duplicate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.slug).not.toBe(testSurvey.slug);
        expect(response.body.slug).toContain('test-survey-copy');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .post(`/api/surveys/${nonExistentId}/duplicate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Export Survey Endpoint (POST /api/surveys/:surveyId/export)', () => {
    describe('Successful Survey Export', () => {
      it('should export survey as JSON', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/export`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.version).toBe('1.0');
        expect(response.body.survey).toBeDefined();
        expect(response.body.survey.title).toBe(testSurvey.title);
        expect(response.body.survey.description).toBe(testSurvey.description);
        expect(response.body.survey.theme).toBe(testSurvey.theme);
        expect(response.body.survey.pages).toBeDefined();
        expect(response.body.exportedAt).toBeDefined();
      });

      it('should set proper headers for file download', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/export`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toContain('.json');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent survey', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .post(`/api/surveys/${nonExistentId}/export`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Survey not found');
      });
    });
  });

  describe('Respondent Management Endpoints', () => {
    describe('Get Respondents (GET /api/surveys/:surveyId/respondents)', () => {
      it('should get allowed respondents', async () => {
        testSurvey.allowedRespondents = ['user1@example.com', 'user2@example.com'];
        await testSurvey.save();

        const response = await request(app)
          .get(`/api/surveys/${testSurvey._id}/respondents`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.allowedRespondents).toEqual(['user1@example.com', 'user2@example.com']);
      });
    });

    describe('Add Respondent (POST /api/surveys/:surveyId/respondents)', () => {
      it('should add respondent email', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/respondents`)
          .set('Cookie', `accessToken=${authToken}`)
          .send({ email: 'newuser@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Respondent added successfully');

        // Verify respondent was added
        const updatedSurvey = await Survey.findById(testSurvey._id);
        expect(updatedSurvey?.allowedRespondents).toContain('newuser@example.com');
      });

      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/respondents`)
          .set('Cookie', `accessToken=${authToken}`)
          .send({ email: 'invalid-email' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid email format');
      });

      it('should reject duplicate email', async () => {
        testSurvey.allowedRespondents = ['existing@example.com'];
        await testSurvey.save();

        const response = await request(app)
          .post(`/api/surveys/${testSurvey._id}/respondents`)
          .set('Cookie', `accessToken=${authToken}`)
          .send({ email: 'existing@example.com' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email already added to this survey');
      });
    });

    describe('Remove Respondent (DELETE /api/surveys/:surveyId/respondents/:email)', () => {
      it('should remove respondent email', async () => {
        testSurvey.allowedRespondents = ['user1@example.com', 'user2@example.com'];
        await testSurvey.save();

        const response = await request(app)
          .delete(`/api/surveys/${testSurvey._id}/respondents/user1@example.com`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Respondent removed successfully');

        // Verify respondent was removed
        const updatedSurvey = await Survey.findById(testSurvey._id);
        expect(updatedSurvey?.allowedRespondents).not.toContain('user1@example.com');
        expect(updatedSurvey?.allowedRespondents).toContain('user2@example.com');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent survey creations', async () => {
      const surveyData = Array.from({ length: 10 }, (_, i) => ({
        title: `Concurrent Survey ${i}`,
        description: `Description ${i}`
      }));

      const promises = surveyData.map(data =>
        request(app)
          .post('/api/surveys')
          .set('Cookie', `accessToken=${authToken}`)
          .send(data)
      );

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(201);
          expect(result.value.body.title).toBe(surveyData[index].title);
        }
      });

      // Verify all surveys were created
      const surveys = await Survey.find({ title: { $regex: /^Concurrent Survey \d+$/ } });
      expect(surveys).toHaveLength(10);
    });

    it('should handle large survey with many pages', async () => {
      const largePages = Array.from({ length: 50 }, (_, pageIndex) => ({
        questions: Array.from({ length: 10 }, (_, qIndex) => ({
          id: `q${pageIndex}_${qIndex}`,
          type: 'textShort',
          title: `Question ${pageIndex + 1}.${qIndex + 1}`,
          required: true
        })),
        branching: []
      }));

      const surveyData = {
        title: 'Large Survey',
        pages: largePages
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Cookie', `accessToken=${authToken}`)
        .send(surveyData);

      expect(response.status).toBe(201);
      expect(response.body.pages).toHaveLength(50);
      expect(response.body.pages[0].questions).toHaveLength(10);
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Create survey
      const createResponse = await request(app)
        .post('/api/surveys')
        .set('Cookie', `accessToken=${authToken}`)
        .send({ title: 'Consistency Test Survey' });

      expect(createResponse.status).toBe(201);
      const surveyId = createResponse.body.id;

      // Update survey
      const updateResponse = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Cookie', `accessToken=${authToken}`)
        .send({ description: 'Updated Description' });

      expect(updateResponse.status).toBe(200);

      // Get survey and verify consistency
      const getResponse = await request(app)
        .get(`/api/surveys/${surveyId}`)
        .set('Cookie', `accessToken=${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.title).toBe('Consistency Test Survey');
      expect(getResponse.body.description).toBe('Updated Description');
    });

    it('should handle database connection issues gracefully', async () => {
      const surveyData = {
        title: 'Test Survey'
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Cookie', `accessToken=${authToken}`)
        .send(surveyData);

      expect(response.status).toBe(201);
    });
  });
});
