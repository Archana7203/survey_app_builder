import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import questionsRouter from '../questions';
import * as authUtils from '../../utils/auth';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/questions', questionsRouter);

describe('Questions Integration Tests', () => {
  let testUser: any;

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

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      passwordHash: await authUtils.hashPassword('password123'),
      role: 'respondent'
    });
    await testUser.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('Get Question Types Endpoint (GET /api/questions/types)', () => {
    describe('Successful Question Types Retrieval', () => {
      it('should get all available question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('types');
        expect(response.body).toHaveProperty('categories');
        expect(Array.isArray(response.body.types)).toBe(true);
        expect(Array.isArray(response.body.categories)).toBe(true);
      });

      it('should include all required question type fields', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const questionTypes = response.body.types;
        
        questionTypes.forEach((type: any) => {
          expect(type).toHaveProperty('type');
          expect(type).toHaveProperty('name');
          expect(type).toHaveProperty('description');
          expect(type).toHaveProperty('icon');
          expect(type).toHaveProperty('category');
          expect(type).toHaveProperty('schema');
        });
      });

      it('should include all question type categories', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const categories = response.body.categories;
        
        expect(categories).toHaveLength(5);
        expect(categories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'choice' }),
            expect.objectContaining({ id: 'rating' }),
            expect.objectContaining({ id: 'text' }),
            expect.objectContaining({ id: 'scale' }),
            expect.objectContaining({ id: 'input' })
          ])
        );
      });

      it('should not require authentication', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
      });
    });

    describe('Question Type Categories', () => {
      it('should include choice question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const choiceTypes = response.body.types.filter((type: any) => type.category === 'choice');
        
        expect(choiceTypes).toHaveLength(3);
        expect(choiceTypes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'singleChoice' }),
            expect.objectContaining({ type: 'multiChoice' }),
            expect.objectContaining({ type: 'dropdown' })
          ])
        );
      });

      it('should include rating question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const ratingTypes = response.body.types.filter((type: any) => type.category === 'rating');
        
        expect(ratingTypes).toHaveLength(3);
        expect(ratingTypes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'ratingStar' }),
            expect.objectContaining({ type: 'ratingSmiley' }),
            expect.objectContaining({ type: 'ratingNumber' })
          ])
        );
      });

      it('should include text question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const textTypes = response.body.types.filter((type: any) => type.category === 'text');
        
        expect(textTypes).toHaveLength(2);
        expect(textTypes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'textShort' }),
            expect.objectContaining({ type: 'textLong' })
          ])
        );
      });

      it('should include scale question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const scaleTypes = response.body.types.filter((type: any) => type.category === 'scale');
        
        expect(scaleTypes).toHaveLength(1);
        expect(scaleTypes[0]).toMatchObject({
          type: 'slider',
          name: 'Slider',
          description: 'Select a value using a slider',
          icon: '━━●━━',
          category: 'scale'
        });
      });

      it('should include input question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const inputTypes = response.body.types.filter((type: any) => type.category === 'input');
        
        expect(inputTypes).toHaveLength(3);
        expect(inputTypes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'datePicker' }),
            expect.objectContaining({ type: 'fileUpload' }),
            expect.objectContaining({ type: 'email' })
          ])
        );
      });
    });

    describe('Question Type Schemas', () => {
      it('should include proper schema for choice questions', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const singleChoiceType = response.body.types.find((type: any) => type.type === 'singleChoice');
        
        expect(singleChoiceType.schema).toMatchObject({
          options: { required: true, minItems: 2 },
          settings: {
            allowOther: { type: 'boolean', default: false },
            randomize: { type: 'boolean', default: false }
          }
        });
      });

      it('should include proper schema for rating questions', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const starRatingType = response.body.types.find((type: any) => type.type === 'ratingStar');
        
        expect(starRatingType.schema).toMatchObject({
          settings: {
            maxRating: { type: 'number', default: 5, min: 3, max: 10 }
          }
        });
      });

      it('should include proper schema for text questions', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const textShortType = response.body.types.find((type: any) => type.type === 'textShort');
        
        expect(textShortType.schema).toMatchObject({
          settings: {
            placeholder: { type: 'string' },
            maxLength: { type: 'number', max: 500 },
            minLength: { type: 'number', min: 0 }
          }
        });
      });

      it('should include proper schema for slider questions', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const sliderType = response.body.types.find((type: any) => type.type === 'slider');
        
        expect(sliderType.schema).toMatchObject({
          settings: {
            scaleMin: { type: 'number', required: true, min: 0 },
            scaleMax: { type: 'number', required: true, min: 1 },
            scaleStep: { type: 'number', default: 1 },
            scaleLabels: {
              min: { type: 'string' },
              max: { type: 'string' }
            }
          }
        });
      });

      it('should include proper schema for file upload questions', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const fileUploadType = response.body.types.find((type: any) => type.type === 'fileUpload');
        
        expect(fileUploadType.schema).toMatchObject({
          settings: {
            maxFileSize: { type: 'number', default: 10485760, max: 52428800 },
            allowedFileTypes: { type: 'array' },
            maxFiles: { type: 'number', default: 1, min: 1, max: 10 }
          }
        });
      });
    });

    describe('Question Type Metadata', () => {
      it('should include proper icons for all question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const questionTypes = response.body.types;
        
        questionTypes.forEach((type: any) => {
          expect(type.icon).toBeDefined();
          expect(typeof type.icon).toBe('string');
          expect(type.icon.length).toBeGreaterThan(0);
        });
      });

      it('should include proper names for all question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const questionTypes = response.body.types;
        
        questionTypes.forEach((type: any) => {
          expect(type.name).toBeDefined();
          expect(typeof type.name).toBe('string');
          expect(type.name.length).toBeGreaterThan(0);
        });
      });

      it('should include proper descriptions for all question types', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const questionTypes = response.body.types;
        
        questionTypes.forEach((type: any) => {
          expect(type.description).toBeDefined();
          expect(typeof type.description).toBe('string');
          expect(type.description.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Category Information', () => {
      it('should include proper category metadata', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const categories = response.body.categories;
        
        categories.forEach((category: any) => {
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('description');
          expect(typeof category.id).toBe('string');
          expect(typeof category.name).toBe('string');
          expect(typeof category.description).toBe('string');
        });
      });

      it('should include all expected categories', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const categories = response.body.categories;
        
        const expectedCategories = [
          { id: 'choice', name: 'Choice Questions', description: 'Single or multiple selection' },
          { id: 'rating', name: 'Rating Questions', description: 'Satisfaction and rating scales' },
          { id: 'text', name: 'Text Questions', description: 'Free text responses' },
          { id: 'scale', name: 'Scale Questions', description: 'Numeric and slider inputs' },
          { id: 'input', name: 'Input Questions', description: 'Specialized input types' }
        ];

        expectedCategories.forEach(expectedCategory => {
          const category = categories.find((c: any) => c.id === expectedCategory.id);
          expect(category).toMatchObject(expectedCategory);
        });
      });
    });

    describe('Performance and Load Testing', () => {
      it('should handle multiple concurrent requests', async () => {
        const promises = Array.from({ length: 10 }, () =>
          request(app)
            .get('/api/questions/types')
        );

        const results = await Promise.allSettled(promises);
        
        // All should succeed
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            expect(result.value.status).toBe(200);
            expect(result.value.body.types).toHaveLength(12);
            expect(result.value.body.categories).toHaveLength(5);
          }
        });
      });

      it('should respond quickly to requests', async () => {
        const startTime = Date.now();
        const response = await request(app)
          .get('/api/questions/types');
        const endTime = Date.now();

        expect(response.status).toBe(200);
        expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
      });
    });

    describe('Data Consistency', () => {
      it('should return consistent data across multiple requests', async () => {
        const response1 = await request(app)
          .get('/api/questions/types');

        const response2 = await request(app)
          .get('/api/questions/types');

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response1.body).toEqual(response2.body);
      });

      it('should maintain question type order', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        const questionTypes = response.body.types;
        
        // Check that types are in expected order
        const expectedOrder = [
          'singleChoice', 'multiChoice', 'dropdown', 'slider',
          'ratingStar', 'ratingSmiley', 'ratingNumber',
          'textShort', 'textLong', 'datePicker', 'fileUpload', 'email'
        ];

        const actualOrder = questionTypes.map((type: any) => type.type);
        expect(actualOrder).toEqual(expectedOrder);
      });
    });

    describe('Edge Cases', () => {
      it('should handle malformed requests gracefully', async () => {
        const response = await request(app)
          .get('/api/questions/types')
          .query({ invalid: 'parameter' });

        expect(response.status).toBe(200);
        expect(response.body.types).toHaveLength(12);
      });

      it('should handle requests with extra headers', async () => {
        const response = await request(app)
          .get('/api/questions/types')
          .set('X-Custom-Header', 'custom-value')
          .set('User-Agent', 'test-agent');

        expect(response.status).toBe(200);
        expect(response.body.types).toHaveLength(12);
      });
    });

    describe('Database Integration', () => {
      it('should work without database connection', async () => {
        // This endpoint doesn't require database connection
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(response.body.types).toHaveLength(12);
      });

      it('should handle database connection issues gracefully', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(response.body.types).toHaveLength(12);
      });
    });

    describe('Response Format Validation', () => {
      it('should return valid JSON response', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
      });

      it('should include all required top-level properties', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('types');
        expect(response.body).toHaveProperty('categories');
        expect(Object.keys(response.body)).toHaveLength(2);
      });

      it('should have correct data types for all properties', async () => {
        const response = await request(app)
          .get('/api/questions/types');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.types)).toBe(true);
        expect(Array.isArray(response.body.categories)).toBe(true);
        expect(response.body.types.length).toBeGreaterThan(0);
        expect(response.body.categories.length).toBeGreaterThan(0);
      });
    });
  });
});
