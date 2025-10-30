import mongoose, { Schema, Document } from 'mongoose';
import { ISurvey } from './Survey';
import { IRespondent } from './Respondent';
import { IRespondentGroup } from './RespondentGroup';

export interface IInvitation {
  respondentId: IRespondent['_id'];
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface ISurveyRespondents extends Document {
  surveyId: ISurvey['_id'];
  allowedRespondents: IRespondent['_id'][];
  allowedGroups: IRespondentGroup['_id'][];
  invitations: IInvitation[];
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema({
  respondentId: {
    type: Schema.Types.ObjectId,
    ref: 'Respondent',
    required: true,
  },
  sentAt: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
}, { _id: false });

const SurveyRespondentsSchema: Schema = new Schema({
  surveyId: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    unique: true,
  },
  allowedRespondents: [{
    type: Schema.Types.ObjectId,
    ref: 'Respondent',
  }],
  allowedGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'RespondentGroup',
  }],
  invitations: [InvitationSchema],
}, {
  timestamps: true,
});

// Compound unique index for surveyId + respondentId within invitations
SurveyRespondentsSchema.index(
  { surveyId: 1, 'invitations.respondentId': 1 },
  { unique: true, sparse: true }
);

export const SurveyRespondents = mongoose.model<ISurveyRespondents>('SurveyRespondents', SurveyRespondentsSchema);

