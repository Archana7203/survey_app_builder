import mongoose, { Schema, Document } from 'mongoose';
import { ISurvey } from './Survey';

export interface IResponse extends Document {
  survey: ISurvey['_id'];
  surveySlug: string;
  respondentEmail?: string;
  responses: Array<{
    questionId: string;
    value: any;
    pageIndex: number;
  }>;
  completedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  startedAt: Date;
  submittedAt?: Date;
  status: 'Pending' | 'InProgress' | 'Completed';
  metadata: {
    timeSpent?: number; // in seconds
    pagesVisited?: number[];
    lastPageIndex?: number;
  };
}

const ResponseSchema: Schema = new Schema({
  survey: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  respondentEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  surveySlug: {
    type: String,
    required: true,
    index: true,
  },
  responses: [{
    questionId: {
      type: String,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    pageIndex: {
      type: Number,
      required: true,
    },
  }],
  completedAt: {
    type: Date,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Completed'],
    default: 'Pending',
  },
  metadata: {
    timeSpent: {
      type: Number,
      default: 0,
    },
    pagesVisited: {
      type: [Number],
      default: [],
    },
    lastPageIndex: {
      type: Number,
      default: 0,
      required: true,
    },
  },
}, {
  timestamps: true,
});

// Index for efficient querying
ResponseSchema.index({ survey: 1, createdAt: -1 });
ResponseSchema.index({ surveySlug: 1, status: 1 });
ResponseSchema.index({ survey: 1, respondentEmail: 1 }, { unique: true, sparse: true });

export const Response = mongoose.model<IResponse>('Response', ResponseSchema);




