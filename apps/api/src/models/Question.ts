import mongoose, { Schema, Document } from 'mongoose';

export enum QuestionType {
  SINGLE_CHOICE = 'singleChoice',
  MULTI_CHOICE = 'multiChoice',
  DROPDOWN = 'dropdown',

  SLIDER = 'slider',
  RATING_STAR = 'ratingStar',
  RATING_SMILEY = 'ratingSmiley',
  RATING_NUMBER = 'ratingNumber',
  TEXT_SHORT = 'textShort',
  TEXT_LONG = 'textLong',
  DATE_PICKER = 'datePicker',
  FILE_UPLOAD = 'fileUpload',
  EMAIL = 'email'
}

export interface IQuestion extends Document {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{
    id: string;
    text: string;
    value?: string;
  }>;
  settings: {
    // Choice-based questions
    allowOther?: boolean;
    randomize?: boolean;
    
    // Slider settings
    scaleMin?: number;
    scaleMax?: number;
    scaleStep?: number;
    scaleLabels?: { min?: string; max?: string };
    
    // Rating settings
    maxRating?: number;
    
    // Text settings
    placeholder?: string;
    maxLength?: number;
    minLength?: number;
    
    // File upload settings
    maxFileSize?: number;
    allowedFileTypes?: string[];
    maxFiles?: number;
    
    // Date settings
    dateFormat?: string;
    minDate?: string;
    maxDate?: string;
    


    // Styling overrides
    backgroundColor?: string;
    textColor?: string;
  };
}

// Zod validation schemas will be added once zod is installed
// For now, using TypeScript interfaces for type safety

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: Array<{
    id: string;
    text: string;
    value?: string;
  }>;
  settings?: any;
}
