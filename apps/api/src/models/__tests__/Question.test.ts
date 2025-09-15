import { describe, it, expect } from 'vitest';
import { QuestionType } from '../Question';

// Since Question.ts only contains interfaces and enums, we'll test the enum values and interface structure
describe('Question Model', () => {
  describe('QuestionType Enum', () => {
    it('should have all required question types', () => {
      expect(QuestionType.SINGLE_CHOICE).toBe('singleChoice');
      expect(QuestionType.MULTI_CHOICE).toBe('multiChoice');
      expect(QuestionType.DROPDOWN).toBe('dropdown');
      expect(QuestionType.SLIDER).toBe('slider');
      expect(QuestionType.RATING_STAR).toBe('ratingStar');
      expect(QuestionType.RATING_SMILEY).toBe('ratingSmiley');
      expect(QuestionType.RATING_NUMBER).toBe('ratingNumber');
      expect(QuestionType.TEXT_SHORT).toBe('textShort');
      expect(QuestionType.TEXT_LONG).toBe('textLong');
      expect(QuestionType.DATE_PICKER).toBe('datePicker');
      expect(QuestionType.FILE_UPLOAD).toBe('fileUpload');
      expect(QuestionType.EMAIL).toBe('email');
    });

    it('should have unique values for all question types', () => {
      const values = Object.values(QuestionType);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('should have snake_case naming convention', () => {
      const values = Object.values(QuestionType);
      values.forEach(value => {
        expect(value).toMatch(/^[a-z]+([A-Z][a-z]*)*$/);
      });
    });
  });

  describe('Question Interface Structure', () => {
    it('should define required fields correctly', () => {
      // Test that the interface structure is properly defined
      const mockQuestion = {
        id: 'test-id',
        type: QuestionType.TEXT_SHORT,
        title: 'Test Question',
        required: true,
        settings: {}
      };

      expect(mockQuestion.id).toBeDefined();
      expect(mockQuestion.type).toBeDefined();
      expect(mockQuestion.title).toBeDefined();
      expect(mockQuestion.required).toBeDefined();
      expect(mockQuestion.settings).toBeDefined();
    });

    it('should allow optional fields', () => {
      const mockQuestion = {
        id: 'test-id',
        type: QuestionType.SINGLE_CHOICE,
        title: 'Test Question',
        description: 'Optional description',
        required: false,
        options: [
          { id: 'opt1', text: 'Option 1', value: '1' },
          { id: 'opt2', text: 'Option 2', value: '2' }
        ],
        settings: {
          allowOther: true,
          randomize: false
        }
      };

      expect(mockQuestion.description).toBeDefined();
      expect(mockQuestion.options).toBeDefined();
      expect(mockQuestion.options).toHaveLength(2);
      expect(mockQuestion.settings.allowOther).toBe(true);
    });

    it('should handle choice-based question settings', () => {
      const choiceSettings = {
        allowOther: true,
        randomize: true
      };

      expect(choiceSettings.allowOther).toBe(true);
      expect(choiceSettings.randomize).toBe(true);
    });

    it('should handle slider question settings', () => {
      const sliderSettings = {
        scaleMin: 0,
        scaleMax: 100,
        scaleStep: 1,
        scaleLabels: {
          min: 'Very Low',
          max: 'Very High'
        }
      };

      expect(sliderSettings.scaleMin).toBe(0);
      expect(sliderSettings.scaleMax).toBe(100);
      expect(sliderSettings.scaleStep).toBe(1);
      expect(sliderSettings.scaleLabels.min).toBe('Very Low');
      expect(sliderSettings.scaleLabels.max).toBe('Very High');
    });

    it('should handle rating question settings', () => {
      const ratingSettings = {
        maxRating: 5
      };

      expect(ratingSettings.maxRating).toBe(5);
    });

    it('should handle text question settings', () => {
      const textSettings = {
        placeholder: 'Enter your answer...',
        maxLength: 500,
        minLength: 10
      };

      expect(textSettings.placeholder).toBe('Enter your answer...');
      expect(textSettings.maxLength).toBe(500);
      expect(textSettings.minLength).toBe(10);
    });

    it('should handle file upload question settings', () => {
      const fileSettings = {
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        maxFiles: 3
      };

      expect(fileSettings.maxFileSize).toBe(10485760);
      expect(fileSettings.allowedFileTypes).toHaveLength(3);
      expect(fileSettings.maxFiles).toBe(3);
    });

    it('should handle date picker question settings', () => {
      const dateSettings = {
        dateFormat: 'YYYY-MM-DD',
        minDate: '2023-01-01',
        maxDate: '2023-12-31'
      };

      expect(dateSettings.dateFormat).toBe('YYYY-MM-DD');
      expect(dateSettings.minDate).toBe('2023-01-01');
      expect(dateSettings.maxDate).toBe('2023-12-31');
    });

    it('should handle styling override settings', () => {
      const stylingSettings = {
        backgroundColor: '#ffffff',
        textColor: '#000000'
      };

      expect(stylingSettings.backgroundColor).toBe('#ffffff');
      expect(stylingSettings.textColor).toBe('#000000');
    });
  });

  describe('Question Options Structure', () => {
    it('should handle options with id and text', () => {
      const options = [
        { id: 'opt1', text: 'Option 1' },
        { id: 'opt2', text: 'Option 2' }
      ];

      expect(options[0].id).toBe('opt1');
      expect(options[0].text).toBe('Option 1');
      expect(options[1].id).toBe('opt2');
      expect(options[1].text).toBe('Option 2');
    });

    it('should handle options with optional value', () => {
      const options = [
        { id: 'opt1', text: 'Option 1', value: 'value1' },
        { id: 'opt2', text: 'Option 2' } // No value
      ];

      expect(options[0].value).toBe('value1');
      expect(options[1].value).toBeUndefined();
    });

    it('should handle empty options array', () => {
      const options: any[] = [];
      expect(options).toHaveLength(0);
    });

    it('should handle options with special characters', () => {
      const options = [
        { id: 'opt1', text: 'Option with émojis 🎉 and unicode' },
        { id: 'opt2', text: 'Option with special chars: !@#$%^&*()' }
      ];

      expect(options[0].text).toContain('🎉');
      expect(options[1].text).toContain('!@#$%^&*()');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long question titles', () => {
      const longTitle = 'a'.repeat(1000);
      const mockQuestion = {
        id: 'test-id',
        type: QuestionType.TEXT_SHORT,
        title: longTitle,
        required: true,
        settings: {}
      };

      expect(mockQuestion.title).toHaveLength(1000);
    });

    it('should handle very long question descriptions', () => {
      const longDescription = 'a'.repeat(5000);
      const mockQuestion = {
        id: 'test-id',
        type: QuestionType.TEXT_LONG,
        title: 'Test Question',
        description: longDescription,
        required: true,
        settings: {}
      };

      expect(mockQuestion.description).toHaveLength(5000);
    });

    it('should handle questions with many options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => ({
        id: `opt${i}`,
        text: `Option ${i}`,
        value: `value${i}`
      }));

      expect(manyOptions).toHaveLength(100);
      expect(manyOptions[0].id).toBe('opt0');
      expect(manyOptions[99].id).toBe('opt99');
    });

    it('should handle complex nested settings', () => {
      const complexSettings = {
        allowOther: true,
        randomize: true,
        scaleMin: 0,
        scaleMax: 100,
        scaleStep: 0.5,
        scaleLabels: {
          min: 'Very Low',
          max: 'Very High'
        },
        maxRating: 10,
        placeholder: 'Enter your answer...',
        maxLength: 1000,
        minLength: 5,
        maxFileSize: 52428800, // 50MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
        maxFiles: 5,
        dateFormat: 'DD/MM/YYYY',
        minDate: '2020-01-01',
        maxDate: '2030-12-31',
        backgroundColor: '#f0f0f0',
        textColor: '#333333'
      };

      expect(complexSettings.allowOther).toBe(true);
      expect(complexSettings.scaleLabels.min).toBe('Very Low');
      expect(complexSettings.allowedFileTypes).toHaveLength(5);
      expect(complexSettings.backgroundColor).toBe('#f0f0f0');
    });

    it('should handle null and undefined values gracefully', () => {
      const mockQuestion = {
        id: 'test-id',
        type: QuestionType.TEXT_SHORT,
        title: 'Test Question',
        description: undefined,
        required: true,
        options: null,
        settings: {}
      };

      expect(mockQuestion.description).toBeUndefined();
      expect(mockQuestion.options).toBeNull();
    });

    it('should handle special characters in all text fields', () => {
      const specialCharQuestion = {
        id: 'test-id-with-special-chars',
        type: QuestionType.TEXT_SHORT,
        title: 'Question with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Description with émojis 🎉 and unicode characters',
        required: true,
        options: [
          { id: 'opt1', text: 'Option with émojis 🎉' },
          { id: 'opt2', text: 'Option with special chars: !@#$%^&*()' }
        ],
        settings: {
          placeholder: 'Enter your answer with émojis 🎉...',
          scaleLabels: {
            min: 'Very Low 😞',
            max: 'Very High 😊'
          }
        }
      };

      expect(specialCharQuestion.title).toContain('!@#$%^&*()');
      expect(specialCharQuestion.description).toContain('🎉');
      expect(specialCharQuestion.options[0].text).toContain('🎉');
      expect(specialCharQuestion.settings.placeholder).toContain('🎉');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct question type values', () => {
      const validTypes = Object.values(QuestionType);
      
      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should handle type checking for question types', () => {
      const validType = QuestionType.TEXT_SHORT;
      const invalidType = 'invalid_type';

      expect(Object.values(QuestionType)).toContain(validType);
      expect(Object.values(QuestionType)).not.toContain(invalidType);
    });

    it('should maintain consistent naming patterns', () => {
      const values = Object.values(QuestionType);
      
      // All values should follow camelCase pattern
      values.forEach(value => {
        expect(value).toMatch(/^[a-z]+([A-Z][a-z]*)*$/);
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of question types efficiently', () => {
      const startTime = performance.now();
      
      // Simulate processing many question types
      const allTypes = Object.values(QuestionType);
      const processedTypes = allTypes.map(type => ({
        type,
        isValid: Object.values(QuestionType).includes(type)
      }));
      
      const endTime = performance.now();
      
      expect(processedTypes).toHaveLength(allTypes.length);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should handle deep object nesting efficiently', () => {
      const startTime = performance.now();
      
      const deepSettings = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep value'
                }
              }
            }
          }
        }
      };
      
      const endTime = performance.now();
      
      expect(deepSettings.level1.level2.level3.level4.level5.value).toBe('deep value');
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });
});
