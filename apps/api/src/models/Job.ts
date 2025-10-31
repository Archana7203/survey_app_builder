import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  type: 'send_invitations';
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  surveyId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  progress?: {
    total?: number;
    processed?: number;
    success?: number;
    failed?: number;
  };
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  type: { type: String, enum: ['send_invitations'], required: true },
  status: { type: String, enum: ['queued', 'in_progress', 'completed', 'failed'], default: 'queued' },
  surveyId: { type: Schema.Types.ObjectId, ref: 'Survey' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  progress: {
    total: { type: Number },
    processed: { type: Number },
    success: { type: Number },
    failed: { type: Number },
  },
  error: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date },
}, { timestamps: true });

export const Job = mongoose.model<IJob>('Job', JobSchema);


