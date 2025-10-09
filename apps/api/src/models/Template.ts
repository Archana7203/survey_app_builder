import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  estimatedTime: string;
  pages: Array<{
    questions: Array<any>;
    branching?: Array<any>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  estimatedTime: {
    type: String,
    required: true,
  },
  pages: [{
    questions: [{
      type: Schema.Types.Mixed,
    }],
    branching: [{
      type: Schema.Types.Mixed,
    }],
  }],
}, {
  timestamps: true,
});

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);