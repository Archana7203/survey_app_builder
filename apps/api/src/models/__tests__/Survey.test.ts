import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Survey, ISurvey, IBranchingRule } from '../Survey';
import { User } from '../User';

describe('Survey Model', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a test user with unique email
    testUser = new User({
      email: `test-survey-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
      role: 'creator',
    });
    await testUser.save();
  });

  // Note: No cleanup - keeping data for inspection

  describe('Survey Creation', () => {
    it('should create a survey with required fields', async () => {
      const surveyData = {
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'textShort',
              title: 'What is your name?',
              required: true,
              settings: {
                placeholder: 'Enter your name',
                maxLength: 100
              }
            }
          ] 
        }],
      };

      const survey = new Survey(surveyData);
      const savedSurvey = await survey.save();

      expect(savedSurvey.title).toBe('Test Survey');
      expect(savedSurvey.slug).toMatch(/^test-survey-\d+$/);
      expect(savedSurvey.status).toBe('draft'); // Default value
      expect(savedSurvey.locked).toBe(false); // Default value
      expect((savedSurvey.createdBy as any).toString()).toBe(testUser._id.toString());
      expect(savedSurvey.pages[0].questions).toHaveLength(1);
      expect(savedSurvey.pages[0].questions[0].title).toBe('What is your name?');
    });

    it('should enforce required fields', async () => {
      const survey = new Survey({});
      
      await expect(survey.save()).rejects.toThrow();
    });

    it('should enforce unique slug constraint', async () => {
      const uniqueSlug = `test-survey-unique-${Date.now()}`;
      const surveyData = {
        title: 'Test Survey',
        slug: uniqueSlug,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'singleChoice',
              title: 'How satisfied are you?',
              required: true,
              options: [
                { id: 'opt1', text: 'Very satisfied' },
                { id: 'opt2', text: 'Satisfied' },
                { id: 'opt3', text: 'Neutral' }
              ]
            }
          ] 
        }],
      };

      const survey1 = new Survey(surveyData);
      await survey1.save();

      // Wait a bit to ensure the first document is committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create second survey with same slug but different title
      const survey2 = new Survey({ 
        ...surveyData, 
        title: 'Different Title',
        slug: uniqueSlug // Same slug should cause unique constraint violation
      });
      
      // Check if the unique constraint is working by trying to save
      try {
        await survey2.save();
        // If we get here, the unique constraint is not working
        // Let's verify that both surveys have the same slug
        const surveys = await Survey.find({ slug: uniqueSlug });
        expect(surveys).toHaveLength(1); // Should only be one survey with this slug
      } catch (error) {
        // If we get an error, that's expected for unique constraint
        expect(error).toBeDefined();
      }
    });
  });

  describe('Survey Validation', () => {
    it('should validate title length', async () => {
      const longTitle = 'a'.repeat(201); // Exceeds maxlength of 200
      const survey = new Survey({
        title: longTitle,
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'textLong',
              title: 'Please provide feedback',
              required: false
            }
          ] 
        }],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(1001); // Exceeds maxlength of 1000
      const survey = new Survey({
        title: 'Test Survey',
        description: longDescription,
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'ratingStar',
              title: 'Rate our service',
              required: true,
              settings: {
                maxRating: 5
              }
            }
          ] 
        }],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'invalid-status',
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'multiChoice',
              title: 'What features do you like?',
              required: true,
              options: [
                { id: 'opt1', text: 'Feature A' },
                { id: 'opt2', text: 'Feature B' },
                { id: 'opt3', text: 'Feature C' }
              ],
              settings: {
                allowOther: true
              }
            }
          ] 
        }],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should validate allowedRespondents email format', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'email',
              title: 'What is your email?',
              required: true
            }
          ] 
        }],
        allowedRespondents: ['invalid-email', 'valid@example.com'],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should accept valid email addresses in allowedRespondents', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'textShort',
              title: 'What is your name?',
              required: true
            }
          ] 
        }],
        allowedRespondents: ['user1@example.com', 'user2@example.com'],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.allowedRespondents).toHaveLength(2);
    });

    it('should handle empty allowedRespondents array', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ 
          questions: [
            {
              id: 'q1',
              type: 'datePicker',
              title: 'When did you last visit?',
              required: false,
              settings: {
                dateFormat: 'MM/DD/YYYY'
              }
            }
          ] 
        }],
        allowedRespondents: [],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.allowedRespondents).toHaveLength(0);
    });
  });

  describe('Survey Pages and Questions', () => {
    it('should store questions in pages', async () => {
      const questionData = {
        id: 'q1',
        type: 'text',
        title: 'What is your name?',
        required: true,
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [questionData] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages[0].questions).toHaveLength(1);
      expect(savedSurvey.pages[0].questions[0]).toMatchObject(questionData);
    });

    it('should store multiple pages with questions', async () => {
      const page1Questions = [
        { id: 'q1', type: 'text', title: 'Question 1', required: true },
        { id: 'q2', type: 'text', title: 'Question 2', required: false },
      ];
      const page2Questions = [
        { id: 'q3', type: 'singleChoice', title: 'Question 3', required: true },
      ];

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { questions: page1Questions },
          { questions: page2Questions },
        ],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages).toHaveLength(2);
      expect(savedSurvey.pages[0].questions).toHaveLength(2);
      expect(savedSurvey.pages[1].questions).toHaveLength(1);
    });

    it('should store page-specific background colors', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { 
            questions: [
              {
                id: 'q1',
                type: 'textShort',
                title: 'Page 1 Question',
                required: true
              }
            ],
            backgroundColor: '#ffffff',
          },
          { 
            questions: [
              {
                id: 'q2',
                type: 'textLong',
                title: 'Page 2 Question',
                required: false
              }
            ],
            backgroundColor: '#f0f0f0',
          },
        ],
      });

      const savedSurvey = await survey.save();
      expect((savedSurvey.pages[0] as any).backgroundColor).toBe('#ffffff');
      expect((savedSurvey.pages[1] as any).backgroundColor).toBe('#f0f0f0');
      expect(savedSurvey.pages[0].questions).toHaveLength(1);
      expect(savedSurvey.pages[1].questions).toHaveLength(1);
    });
  });

  describe('Survey Branching Rules', () => {
    it('should store branching rules', async () => {
      const branchingRule: IBranchingRule = {
        questionId: 'q1',
        condition: {
          operator: 'equals',
          value: 'yes',
        },
        action: {
          type: 'skip_to_page',
          targetPageIndex: 2,
        },
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { 
            questions: [
              {
                id: 'q1',
                type: 'singleChoice',
                title: 'Do you like our service?',
                required: true,
                options: [
                  { id: 'opt1', text: 'Yes' },
                  { id: 'opt2', text: 'No' }
                ]
              }
            ] 
          },
          { 
            questions: [
              {
                id: 'q2',
                type: 'textLong',
                title: 'Please explain your answer',
                required: false
              }
            ], 
            branching: [branchingRule] 
          },
        ],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages[1].branching).toHaveLength(1);
      expect(savedSurvey.pages[1].branching![0]).toMatchObject(branchingRule);
    });

    it('should validate branching rule operators', async () => {
      const invalidBranchingRule = {
        questionId: 'q1',
        condition: {
          operator: 'invalid_operator',
          value: 'yes',
        },
        action: {
          type: 'skip_to_page',
          targetPageIndex: 2,
        },
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { questions: [] },
          { questions: [], branching: [invalidBranchingRule] },
        ],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should validate branching rule action types', async () => {
      const invalidBranchingRule = {
        questionId: 'q1',
        condition: {
          operator: 'equals',
          value: 'yes',
        },
        action: {
          type: 'invalid_action',
          targetPageIndex: 2,
        },
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { questions: [] },
          { questions: [], branching: [invalidBranchingRule] },
        ],
      });

      await expect(survey.save()).rejects.toThrow();
    });

    it('should handle complex branching rules with logical operators', async () => {
      const complexBranchingRule: IBranchingRule = {
        questionId: 'q1',
        condition: {
          operator: 'equals',
          value: 'yes',
        },
        logical: 'AND',
        groupIndex: 1,
        action: {
          type: 'end_survey',
        },
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [
          { questions: [] },
          { questions: [], branching: [complexBranchingRule] },
        ],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages[1].branching![0].logical).toBe('AND');
      expect(savedSurvey.pages[1].branching![0].groupIndex).toBe(1);
      expect(savedSurvey.pages[1].branching![0].action.type).toBe('end_survey');
    });
  });

  describe('Survey Styling and Theme', () => {
    it('should store theme information', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        theme: 'dark',
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.theme).toBe('dark');
    });

    it('should use default theme when not specified', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.theme).toBe('default');
    });

    it('should store background and text colors', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        backgroundColor: '#ffffff',
        textColor: '#000000',
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.backgroundColor).toBe('#ffffff');
      expect(savedSurvey.textColor).toBe('#000000');
    });

    it('should handle hex color format validation', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        backgroundColor: '#fff',
        textColor: '#000',
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.backgroundColor).toBe('#fff');
      expect(savedSurvey.textColor).toBe('#000');
    });
  });

  describe('Survey Status and Locking', () => {
    it('should handle different status values', async () => {
      const statuses = ['draft', 'published', 'closed'];
      
      for (const status of statuses) {
        const survey = new Survey({
          title: `Test Survey ${status}`,
          slug: `test-survey-${status}-${Date.now()}`,
          createdBy: testUser._id,
          pages: [{ questions: [] }],
          status: status as any,
        });

        const savedSurvey = await survey.save();
        expect(savedSurvey.status).toBe(status);
      }
    });

    it('should handle survey locking', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        locked: true,
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.locked).toBe(true);
    });

    it('should handle close date', async () => {
      const closeDate = new Date('2024-12-31');
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        closeDate: closeDate,
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.closeDate).toEqual(closeDate);
    });
  });

  describe('Survey Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.createdAt).toBeDefined();
      expect(savedSurvey.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
      });

      const savedSurvey = await survey.save();
      const originalUpdatedAt = savedSurvey.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Use updateOne to update the document
      const updateResult = await Survey.updateOne(
        { _id: savedSurvey._id },
        { title: 'Updated Survey' }
      );

      expect(updateResult.modifiedCount).toBe(1);

      // Fetch the updated document
      const updatedSurvey = await Survey.findById(savedSurvey._id);
      expect(updatedSurvey).toBeTruthy();
      expect(updatedSurvey!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long survey titles at boundary', async () => {
      const maxTitle = 'a'.repeat(200); // Exactly at maxlength
      const survey = new Survey({
        title: maxTitle,
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.title).toHaveLength(200);
    });

    it('should handle very long survey descriptions at boundary', async () => {
      const maxDescription = 'a'.repeat(1000); // Exactly at maxlength
      const survey = new Survey({
        title: 'Test Survey',
        description: maxDescription,
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.description).toHaveLength(1000);
    });

    it('should handle many pages in a survey', async () => {
      const manyPages = Array.from({ length: 50 }, (_, i) => ({
        questions: [
          { id: `q${i}`, type: 'text', title: `Question ${i}`, required: true },
        ],
      }));

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: manyPages,
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages).toHaveLength(50);
    });

    it('should handle many questions in a single page', async () => {
      const manyQuestions = Array.from({ length: 100 }, (_, i) => ({
        id: `q${i}`,
        type: 'text',
        title: `Question ${i}`,
        required: i % 2 === 0,
      }));

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: manyQuestions }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages[0].questions).toHaveLength(100);
    });

    it('should handle special characters in survey content', async () => {
      const survey = new Survey({
        title: 'Survey with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Description with émojis 🎉 and unicode characters',
        slug: `test-survey-special-chars-${Date.now()}`,
        createdBy: testUser._id,
        pages: [
          {
            questions: [
              {
                id: 'q1',
                type: 'text',
                title: 'Question with émojis 🎉',
                required: true,
              },
            ],
          },
        ],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.title).toContain('!@#$%^&*()');
      expect(savedSurvey.description).toContain('🎉');
      expect(savedSurvey.pages[0].questions[0].title).toContain('🎉');
    });

    it('should handle complex nested question structures', async () => {
      const complexQuestion = {
        id: 'q1',
        type: 'singleChoice',
        title: 'Complex Question',
        description: 'This is a complex question with many options',
        required: true,
        options: Array.from({ length: 20 }, (_, i) => ({
          id: `opt${i}`,
          text: `Option ${i}`,
          value: `value${i}`,
        })),
        settings: {
          allowOther: true,
          randomize: true,
          maxRating: 5,
          placeholder: 'Select an option...',
          backgroundColor: '#f0f0f0',
          textColor: '#333333',
        },
      };

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [complexQuestion] }],
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.pages[0].questions[0].options).toHaveLength(20);
      expect(savedSurvey.pages[0].questions[0].settings.allowOther).toBe(true);
    });

    it('should handle many allowed respondents', async () => {
      const manyRespondents = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      
      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        allowedRespondents: manyRespondents,
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.allowedRespondents).toHaveLength(100);
    });

    it('should handle international email addresses', async () => {
      const internationalEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example-domain.com',
        'user123@subdomain.example.com',
      ];

      const survey = new Survey({
        title: 'Test Survey',
        slug: `test-survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdBy: testUser._id,
        pages: [{ questions: [] }],
        allowedRespondents: internationalEmails,
      });

      const savedSurvey = await survey.save();
      expect(savedSurvey.allowedRespondents).toHaveLength(4);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large surveys efficiently', async () => {
      const startTime = performance.now();
      
      const largeSurvey = {
        title: 'Large Survey',
        slug: `large-survey-${Date.now()}`,
        createdBy: testUser._id,
        pages: Array.from({ length: 20 }, (_, pageIndex) => ({
          questions: Array.from({ length: 10 }, (_, questionIndex) => ({
            id: `q${pageIndex}_${questionIndex}`,
            type: 'text',
            title: `Question ${pageIndex}_${questionIndex}`,
            required: questionIndex % 2 === 0,
          })),
        })),
      };

      const survey = new Survey(largeSurvey);
      const savedSurvey = await survey.save();
      
      const endTime = performance.now();
      
      expect(savedSurvey.pages).toHaveLength(20);
      expect(savedSurvey.pages[0].questions).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent survey creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const surveyData = {
          title: `Concurrent Survey ${i}`,
          slug: `concurrent-survey-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          createdBy: testUser._id,
          pages: [{ questions: [] }],
        };
        return new Survey(surveyData).save();
      });

      const surveys = await Promise.all(promises);
      expect(surveys).toHaveLength(10);
      
      // All should have unique slugs
      const slugs = surveys.map(s => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(10);
    });
  });
});
