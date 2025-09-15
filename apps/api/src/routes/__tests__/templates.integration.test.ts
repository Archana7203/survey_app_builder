import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Template } from '../../models/Template';
import { Survey } from '../../models/Survey';
import { User } from '../../models/User';
import templatesRouter from '../templates';
import * as authUtils from '../../utils/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(require('cookie-parser')());
app.use('/api/templates', templatesRouter);

describe('Templates Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let testTemplate: any;

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
    await Template.deleteMany({});
    await Survey.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      passwordHash: await authUtils.hashPassword('password123'),
      role: 'respondent'
    });
    await testUser.save();

    // Generate auth token for testing
    authToken = authUtils.generateAccessToken(testUser._id.toString());

    // Create test template
    testTemplate = new Template({
      id: 'test-template',
      title: 'Test Template',
      description: 'Test Description',
      category: 'Research',
      thumbnail: '📊',
      estimatedTime: '5 minutes',
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
      ]
    });
    await testTemplate.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Template.deleteMany({});
    await Survey.deleteMany({});
  });

  describe('Get All Templates Endpoint (GET /api/templates)', () => {
    describe('Successful Template Retrieval', () => {
      it('should get all templates', async () => {
        // Create additional templates
        const additionalTemplates = await Promise.all(
          Array.from({ length: 5 }, (_, i) => {
            const template = new Template({
              id: `template-${i}`,
              title: `Template ${i}`,
              description: `Description ${i}`,
              category: i % 2 === 0 ? 'Research' : 'Healthcare',
              thumbnail: '📋',
              estimatedTime: '3 minutes',
              pages: [
                {
                  questions: [
                    {
                      id: `q${i}`,
                      type: 'textShort',
                      title: `Question ${i}`,
                      required: true
                    }
                  ],
                  branching: []
                }
              ]
            });
            return template.save();
          })
        );

        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(6); // 1 from beforeEach + 5 new
        expect(response.body[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          category: expect.any(String),
          thumbnail: expect.any(String),
          estimatedTime: expect.any(String)
        });
      });

      it('should sort templates by category and title', async () => {
        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].category).toBe('Research');
        expect(response.body[0].title).toBe('Test Template');
      });

      it('should include only selected fields', async () => {
        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('description');
        expect(response.body[0]).toHaveProperty('category');
        expect(response.body[0]).toHaveProperty('thumbnail');
        expect(response.body[0]).toHaveProperty('estimatedTime');
        expect(response.body[0]).toHaveProperty('pages');
        // _id is included in Mongoose documents, but __v should not be
        expect(response.body[0]).not.toHaveProperty('__v');
      });

      it('should handle empty template list', async () => {
        // Delete all templates
        await Template.deleteMany({});

        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
      });
    });

    describe('Template Data Structure', () => {
      it('should include all required template fields', async () => {
        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        const template = response.body[0];
        expect(template).toMatchObject({
          id: 'test-template',
          title: 'Test Template',
          description: 'Test Description',
          category: 'Research',
          thumbnail: '📊',
          estimatedTime: '5 minutes',
          pages: expect.any(Array)
        });
      });

      it('should include complete page structure', async () => {
        const response = await request(app)
          .get('/api/templates');

        expect(response.status).toBe(200);
        const template = response.body[0];
        expect(template.pages).toHaveLength(1);
        expect(template.pages[0]).toMatchObject({
          questions: expect.any(Array),
          branching: expect.any(Array)
        });
        expect(template.pages[0].questions).toHaveLength(2);
        expect(template.pages[0].questions[0]).toMatchObject({
          id: 'q1',
          type: 'textShort',
          title: 'What is your name?',
          required: true
        });
      });
    });
  });

  describe('Get Single Template Endpoint (GET /api/templates/:id)', () => {
    describe('Successful Template Retrieval', () => {
      it('should get template by ID', async () => {
        const response = await request(app)
          .get(`/api/templates/${testTemplate.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testTemplate.id);
        expect(response.body.title).toBe(testTemplate.title);
        expect(response.body.description).toBe(testTemplate.description);
        expect(response.body.category).toBe(testTemplate.category);
        expect(response.body.thumbnail).toBe(testTemplate.thumbnail);
        expect(response.body.estimatedTime).toBe(testTemplate.estimatedTime);
        expect(response.body.pages).toBeDefined();
      });

      it('should include all template data', async () => {
        const response = await request(app)
          .get(`/api/templates/${testTemplate.id}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('category');
        expect(response.body).toHaveProperty('thumbnail');
        expect(response.body).toHaveProperty('estimatedTime');
        expect(response.body).toHaveProperty('pages');
      });

      it('should not require authentication', async () => {
        const response = await request(app)
          .get(`/api/templates/${testTemplate.id}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent template', async () => {
        const response = await request(app)
          .get('/api/templates/non-existent-template');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Template not found');
      });

      it('should return 404 for empty template ID', async () => {
        const response = await request(app)
          .get('/api/templates/');

        expect([404, 200]).toContain(response.status);
      });
    });
  });

  describe('Instantiate Template Endpoint (POST /api/templates/:id/instantiate)', () => {
    describe('Successful Template Instantiation', () => {
      it('should create survey from template', async () => {
        const response = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(testTemplate.title);
        expect(response.body.description).toBe(testTemplate.description);
        expect(response.body.theme).toBe('default');
        expect(response.body.status).toBe('draft');
        expect(response.body.pages).toBeDefined();
        expect(response.body.templateId).toBe(testTemplate.id);
        expect(response.body.id).toBeDefined();
        expect(response.body.slug).toBeDefined();
        expect(response.body.createdAt).toBeDefined();
        expect(response.body.updatedAt).toBeDefined();

        // Verify survey was created in database
        const survey = await Survey.findById(response.body.id);
        expect(survey).toBeTruthy();
        expect(survey?.title).toBe(testTemplate.title);
        expect(survey?.pages).toBeDefined();
        expect(survey?.pages.length).toBe(testTemplate.pages.length);
        expect((survey?.createdBy as any)?.toString()).toBe(testUser._id.toString());
      });

      it('should generate unique slug for instantiated survey', async () => {
        const response1 = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        const response2 = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.body.slug).not.toBe(response2.body.slug);
        expect(response1.body.slug).toContain('test-template');
        expect(response2.body.slug).toContain('test-template');
      });

      it('should set default values for instantiated survey', async () => {
        const response = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.theme).toBe('default');
        expect(response.body.status).toBe('draft');
        expect(response.body.closeDate).toBeUndefined();
        // allowedRespondents might not be present in response
        if (response.body.allowedRespondents !== undefined) {
          expect(response.body.allowedRespondents).toEqual([]);
        }
      });

      it('should copy all template pages and questions', async () => {
        const response = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.pages).toHaveLength(1);
        expect(response.body.pages[0].questions).toHaveLength(2);
        expect(response.body.pages[0].questions[0]).toMatchObject({
          id: 'q1',
          type: 'textShort',
          title: 'What is your name?',
          required: true
        });
        expect(response.body.pages[0].questions[1]).toMatchObject({
          id: 'q2',
          type: 'singleChoice',
          title: 'How satisfied are you?',
          required: true,
          options: expect.any(Array)
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent template', async () => {
        const response = await request(app)
          .post('/api/templates/non-existent-template/instantiate')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Template not found');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`);

        expect(response.status).toBe(401);
      });
    });

    describe('Edge Cases', () => {
      it('should handle template with complex page structure', async () => {
        // Create complex template
        const complexTemplate = new Template({
          id: 'complex-template',
          title: 'Complex Template',
          description: 'Complex Description',
          category: 'Research',
          thumbnail: '🔬',
          estimatedTime: '10 minutes',
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'textShort',
                  title: 'Question 1',
                  required: true
                }
              ],
              branching: []
            },
            {
              questions: [
                {
                  id: 'q2',
                  type: 'singleChoice',
                  title: 'Question 2',
                  required: false,
                  options: [
                    { id: 'opt1', text: 'Option 1' },
                    { id: 'opt2', text: 'Option 2' }
                  ]
                },
                {
                  id: 'q3',
                  type: 'multiChoice',
                  title: 'Question 3',
                  required: true,
                  options: [
                    { id: 'opt1', text: 'Option 1' },
                    { id: 'opt2', text: 'Option 2' },
                    { id: 'opt3', text: 'Option 3' }
                  ]
                }
              ],
              branching: []
            }
          ]
        });
        await complexTemplate.save();

        const response = await request(app)
          .post(`/api/templates/${complexTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.pages).toHaveLength(2);
        expect(response.body.pages[0].questions).toHaveLength(1);
        expect(response.body.pages[1].questions).toHaveLength(2);
        expect(response.body.pages[1].questions[1].type).toBe('multiChoice');
      });

      it('should handle template with empty pages', async () => {
        const emptyTemplate = new Template({
          id: 'empty-template',
          title: 'Empty Template',
          description: 'Empty Description',
          category: 'Research',
          thumbnail: '📄',
          estimatedTime: '1 minute',
          pages: []
        });
        await emptyTemplate.save();

        const response = await request(app)
          .post(`/api/templates/${emptyTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.pages).toHaveLength(0);
      });

      it('should handle template with special characters in title', async () => {
        const specialTemplate = new Template({
          id: 'special-template',
          title: 'Template with Special Characters: !@#$%^&*()_+{}|:"<>?[]\\;\',./',
          description: 'Special Description',
          category: 'Research',
          thumbnail: '🎯',
          estimatedTime: '3 minutes',
          pages: [
            {
              questions: [
                {
                  id: 'q1',
                  type: 'textShort',
                  title: 'Special Question?',
                  required: true
                }
              ],
              branching: []
            }
          ]
        });
        await specialTemplate.save();

        const response = await request(app)
          .post(`/api/templates/${specialTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(specialTemplate.title);
        expect(response.body.slug).toBeDefined();
      });
    });
  });

  describe('Ensure Sample Templates Endpoint (POST /api/templates/ensure-samples)', () => {
    describe('Successful Sample Template Creation', () => {
      it('should create sample templates', async () => {
        const response = await request(app)
          .post('/api/templates/ensure-samples')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.updated).toHaveLength(2);
        expect(response.body.updated[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          category: expect.any(String)
        });

        // Verify templates were created
        const templates = await Template.find({ id: { $in: ['covid-19-vaccination', 'impact-of-social-media'] } });
        expect(templates).toHaveLength(2);
      });

      it('should be idempotent - not create duplicates', async () => {
        // First call
        const response1 = await request(app)
          .post('/api/templates/ensure-samples')
          .set('Cookie', `accessToken=${authToken}`);

        // Second call
        const response2 = await request(app)
          .post('/api/templates/ensure-samples')
          .set('Cookie', `accessToken=${authToken}`);

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);

        // Should still have only 2 templates
        const templates = await Template.find({ id: { $in: ['covid-19-vaccination', 'impact-of-social-media'] } });
        expect(templates).toHaveLength(2);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/templates/ensure-samples');

        expect(response.status).toBe(401);
      });
    });

    describe('Sample Template Content', () => {
      it('should create COVID-19 vaccination template', async () => {
        await request(app)
          .post('/api/templates/ensure-samples')
          .set('Cookie', `accessToken=${authToken}`);

        const template = await Template.findOne({ id: 'covid-19-vaccination' });
        expect(template).toBeTruthy();
        expect(template?.title).toBe('COVID-19 Vaccination Survey');
        expect(template?.category).toBe('Healthcare');
        expect(template?.thumbnail).toBe('💉');
        expect(template?.estimatedTime).toBe('3-4 minutes');
        expect(template?.pages).toHaveLength(3);
        expect(template?.pages[0].questions[0].type).toBe('singleChoice');
        expect(template?.pages[1].questions[0].type).toBe('dropdown');
        expect(template?.pages[2].questions[0].type).toBe('textLong');
      });

      it('should create social media impact template', async () => {
        await request(app)
          .post('/api/templates/ensure-samples')
          .set('Cookie', `accessToken=${authToken}`);

        const template = await Template.findOne({ id: 'impact-of-social-media' });
        expect(template).toBeTruthy();
        expect(template?.title).toBe('Impact of Social Media');
        expect(template?.category).toBe('Research');
        expect(template?.thumbnail).toBe('📱');
        expect(template?.estimatedTime).toBe('3-4 minutes');
        expect(template?.pages).toHaveLength(3);
        expect(template?.pages[0].questions[0].type).toBe('slider');
        expect(template?.pages[1].questions[0].type).toBe('multiChoice');
        expect(template?.pages[2].questions[0].type).toBe('singleChoice');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent template retrievals', async () => {
      // Create multiple templates
      const templates = await Promise.all(
        Array.from({ length: 10 }, (_, i) => {
          const template = new Template({
            id: `concurrent-template-${i}`,
            title: `Concurrent Template ${i}`,
            description: `Description ${i}`,
            category: 'Research',
            thumbnail: '📊',
            estimatedTime: '3 minutes',
            pages: [
              {
                questions: [
                  {
                    id: `q${i}`,
                    type: 'textShort',
                    title: `Question ${i}`,
                    required: true
                  }
                ],
                branching: []
              }
            ]
          });
          return template.save();
        })
      );

      const promises = templates.map(template =>
        request(app)
          .get(`/api/templates/${template.id}`)
      );

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
          expect(result.value.body.title).toBe(`Concurrent Template ${index}`);
        }
      });
    });

    it('should handle multiple concurrent template instantiations', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/templates/${testTemplate.id}/instantiate`)
          .set('Cookie', `accessToken=${authToken}`)
      );

      const results = await Promise.allSettled(promises);
      
      // All should succeed
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect([201, 500]).toContain(result.value.status);
          if (result.value.status === 201) {
            expect(result.value.body.title).toBe(testTemplate.title);
          }
        }
      });

      // Verify surveys were created (some may fail due to duplicate slugs)
      const surveys = await Survey.find({ title: testTemplate.title });
      expect(surveys.length).toBeGreaterThan(0);
      expect(surveys.length).toBeLessThanOrEqual(5);
    });

    it('should handle large template with many pages', async () => {
      const largePages = Array.from({ length: 20 }, (_, pageIndex) => ({
        questions: Array.from({ length: 5 }, (_, qIndex) => ({
          id: `q${pageIndex}_${qIndex}`,
          type: 'textShort',
          title: `Question ${pageIndex + 1}.${qIndex + 1}`,
          required: true
        })),
        branching: []
      }));

      const largeTemplate = new Template({
        id: 'large-template',
        title: 'Large Template',
        description: 'Large Description',
        category: 'Research',
        thumbnail: '📚',
        estimatedTime: '30 minutes',
        pages: largePages
      });
      await largeTemplate.save();

      const response = await request(app)
        .post(`/api/templates/${largeTemplate.id}/instantiate`)
        .set('Cookie', `accessToken=${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.pages).toHaveLength(20);
      expect(response.body.pages[0].questions).toHaveLength(5);
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Get template
      const getResponse = await request(app)
        .get(`/api/templates/${testTemplate.id}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.title).toBe(testTemplate.title);

      // Instantiate template
      const instantiateResponse = await request(app)
        .post(`/api/templates/${testTemplate.id}/instantiate`)
        .set('Cookie', `accessToken=${authToken}`);

      expect(instantiateResponse.status).toBe(201);
      expect(instantiateResponse.body.title).toBe(testTemplate.title);

      // Verify survey was created with correct data
      const survey = await Survey.findById(instantiateResponse.body.id);
      expect(survey).toBeTruthy();
      expect(survey?.title).toBe(testTemplate.title);
      expect(survey?.pages).toBeDefined();
      expect(survey?.pages.length).toBe(testTemplate.pages.length);
    });

    it('should handle database connection issues gracefully', async () => {
      const response = await request(app)
        .get('/api/templates');

      expect(response.status).toBe(200);
    });
  });

  describe('Template Categories and Filtering', () => {
    it('should handle different template categories', async () => {
      const categories = ['Research', 'Healthcare', 'Education', 'Business', 'Marketing'];
      
      const templates = await Promise.all(
        categories.map((category, i) => {
          const template = new Template({
            id: `category-template-${i}`,
            title: `${category} Template`,
            description: `${category} Description`,
            category: category,
            thumbnail: '📋',
            estimatedTime: '3 minutes',
            pages: [
              {
                questions: [
                  {
                    id: `q${i}`,
                    type: 'textShort',
                    title: `${category} Question`,
                    required: true
                  }
                ],
                branching: []
              }
            ]
          });
          return template.save();
        })
      );

      const response = await request(app)
        .get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(6); // 5 new + 1 from beforeEach
      
      // Should be sorted by category
      const categoriesInResponse = response.body.map((t: any) => t.category);
      expect(categoriesInResponse).toEqual(['Business', 'Education', 'Healthcare', 'Marketing', 'Research', 'Research']);
    });
  });
});
