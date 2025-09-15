import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IBranchingRule {
  questionId: string;
  condition: {
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  logical?: 'AND' | 'OR';
  groupIndex?: number;
  action: {
    type: 'skip_to_page' | 'end_survey';
    targetPageIndex?: number;
  };
}

export interface ISurvey extends Document {
  title: string;
  description?: string;
  slug: string;
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  status: 'draft' | 'published' | 'closed';
  locked: boolean;
  closeDate?: Date;
  pages: Array<{
    questions: Array<any>;
    branching?: Array<IBranchingRule>;
  }>;
  allowedRespondents: string[];
  createdBy: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  theme: {
    type: String,
    default: 'default',
  },
  backgroundColor: {
    type: String,
  },
  textColor: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },
  closeDate: {
    type: Date,
  },
  pages: [{
    questions: [{
      type: Schema.Types.Mixed,
    }],
    backgroundColor: {
      type: String,
    },
    branching: [{
      questionId: String,
      condition: {
        operator: {
          type: String,
          enum: ['equals', 'contains', 'greater_than', 'less_than'],
        },
        value: Schema.Types.Mixed,
      },
      logical: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'OR',
      },
      groupIndex: {
        type: Number,
      },
      action: {
        type: {
          type: String,
          enum: ['skip_to_page', 'end_survey'],
        },
        targetPageIndex: Number,
      },
    }],
  }],
  allowedRespondents: {
    type: [String],
    default: [],
    validate: [
      {
        validator: function(emails: string[]) {
          return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        },
        message: 'Invalid email format in allowedRespondents'
      }
    ]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  locked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);

