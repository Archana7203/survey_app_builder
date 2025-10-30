import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IRespondent extends Document {
  azureId?: string;
  name: string;
  mail: string;
  gender: 'male' | 'female' | 'other';
  userPrincipalName?: string;
  accountEnabled?: boolean;
  employeeId?: string;
  createdBy: IUser['_id'];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RespondentSchema: Schema = new Schema({
  azureId: {
    type: String,
    required: false,
    trim: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  userPrincipalName: {
    type: String,
    required: false,
    trim: true,
  },
  accountEnabled: {
    type: Boolean,
    required: false,
    default: true,
  },
  employeeId: {
    type: String,
    required: false,
    trim: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound unique indexes
// azureId index is sparse to allow null values for manually created profiles
RespondentSchema.index({ createdBy: 1, azureId: 1 }, { unique: true, sparse: true });
RespondentSchema.index({ createdBy: 1, mail: 1 }, { unique: true });

export const Respondent = mongoose.model<IRespondent>('Respondent', RespondentSchema);

