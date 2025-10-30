import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IRespondent } from './Respondent';

export interface IRespondentGroup extends Document {
  name: string;
  description?: string;
  members: IRespondent['_id'][];
  createdBy: IUser['_id'];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RespondentGroupSchema: Schema = new Schema({
  name: {
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
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'Respondent',
  }],
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

// Compound unique index
RespondentGroupSchema.index({ createdBy: 1, name: 1 }, { unique: true });

export const RespondentGroup = mongoose.model<IRespondentGroup>('RespondentGroup', RespondentGroupSchema);

