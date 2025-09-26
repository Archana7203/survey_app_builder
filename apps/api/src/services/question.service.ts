import { QuestionType } from '../models/Question';

export class QuestionService {
  getAllQuestionTypes() {
    return [
      {
        type: QuestionType.SINGLE_CHOICE,
        name: 'Single Choice',
        description: 'Choose one option from multiple choices',
        icon: '◉',
        category: 'choice',
        schema: {
          options: { required: true, minItems: 2 },
          settings: { allowOther: { type: 'boolean', default: false }, randomize: { type: 'boolean', default: false } },
        },
      },
      {
        type: QuestionType.MULTI_CHOICE,
        name: 'Multiple Choice',
        description: 'Choose multiple options from a list',
        icon: '☑',
        category: 'choice',
        schema: {
          options: { required: true, minItems: 2 },
          settings: { allowOther: { type: 'boolean', default: false }, randomize: { type: 'boolean', default: false } },
        },
      },
      {
        type: QuestionType.DROPDOWN,
        name: 'Dropdown',
        description: 'Select from a dropdown list',
        icon: '▼',
        category: 'choice',
        schema: {
          options: { required: true, minItems: 2 },
          settings: { allowOther: { type: 'boolean', default: false } },
        },
      },
      {
        type: QuestionType.SLIDER,
        name: 'Slider',
        description: 'Select a value using a slider',
        icon: '━━●━━',
        category: 'scale',
        schema: {
          settings: {
            scaleMin: { type: 'number', required: true, min: 0 },
            scaleMax: { type: 'number', required: true, min: 1 },
            scaleStep: { type: 'number', default: 1 },
            scaleLabels: { min: { type: 'string' }, max: { type: 'string' } },
          },
        },
      },
      {
        type: QuestionType.RATING_STAR,
        name: 'Star Rating',
        description: 'Rate using stars (1-5 or custom)',
        icon: '★',
        category: 'rating',
        schema: { settings: { maxRating: { type: 'number', default: 5, min: 3, max: 10 } } },
      },
      {
        type: QuestionType.RATING_SMILEY,
        name: 'Smiley Rating',
        description: 'Rate using emoji faces',
        icon: '😊',
        category: 'rating',
        schema: { settings: {} },
      },
      {
        type: QuestionType.RATING_NUMBER,
        name: 'Number Rating',
        description: 'Rate using numbered buttons',
        icon: '①②③',
        category: 'rating',
        schema: { settings: { maxRating: { type: 'number', default: 10, min: 5, max: 20 } } },
      },
      {
        type: QuestionType.TEXT_SHORT,
        name: 'Short Text',
        description: 'Single line text input',
        icon: 'abc',
        category: 'text',
        schema: { settings: { placeholder: { type: 'string' }, maxLength: { type: 'number', max: 500 }, minLength: { type: 'number', min: 0 } } },
      },
      {
        type: QuestionType.TEXT_LONG,
        name: 'Long Text',
        description: 'Multi-line text area',
        icon: '📝',
        category: 'text',
        schema: { settings: { placeholder: { type: 'string' }, maxLength: { type: 'number', max: 5000 }, minLength: { type: 'number', min: 0 } } },
      },
      {
        type: QuestionType.DATE_PICKER,
        name: 'Date Picker',
        description: 'Select a date from calendar',
        icon: '📅',
        category: 'input',
        schema: { settings: { dateFormat: { type: 'string', default: 'YYYY-MM-DD' }, minDate: { type: 'string' }, maxDate: { type: 'string' } } },
      },
      {
        type: QuestionType.FILE_UPLOAD,
        name: 'File Upload',
        description: 'Upload files or documents',
        icon: '📎',
        category: 'input',
        schema: {
          settings: {
            maxFileSize: { type: 'number', default: 10485760, max: 52428800 },
            allowedFileTypes: { type: 'array' },
            maxFiles: { type: 'number', default: 1, min: 1, max: 10 },
          },
        },
      },
      {
        type: QuestionType.EMAIL,
        name: 'Email',
        description: 'Email address input with validation',
        icon: '📧',
        category: 'input',
        schema: { settings: { placeholder: { type: 'string', default: 'Enter your email address' } } },
      },
    ];
  }

  getCategories() {
    return [
      { id: 'choice', name: 'Choice Questions', description: 'Single or multiple selection' },
      { id: 'rating', name: 'Rating Questions', description: 'Satisfaction and rating scales' },
      { id: 'text', name: 'Text Questions', description: 'Free text responses' },
      { id: 'scale', name: 'Scale Questions', description: 'Numeric and slider inputs' },
      { id: 'input', name: 'Input Questions', description: 'Specialized input types' },
    ];
  }
}
