import { SurveyRespondents, ISurveyRespondents, IInvitation } from '../models/SurveyRespondents';
import mongoose from 'mongoose';

export class SurveyRespondentsRepository {
  async list(skip = 0, limit = 10) {
    return SurveyRespondents.find()
      .populate('surveyId', 'title status')
      .populate('allowedRespondents', 'name mail')
      .populate('allowedGroups', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count() {
    return SurveyRespondents.countDocuments();
  }

  async getById(id: string) {
    return SurveyRespondents.findById(id)
      .populate('surveyId', 'title status')
      .populate('allowedRespondents', 'name mail gender employeeId')
      .populate('allowedGroups', 'name description');
  }

  async getBySurveyId(surveyId: string) {
    return SurveyRespondents.findOne({ surveyId })
      .populate('allowedRespondents', 'name mail gender employeeId')
      .populate('allowedGroups', 'name description members');
  }

  async getBySurveyIdIdsOnly(surveyId: string) {
    return SurveyRespondents.findOne({ surveyId })
      .select('surveyId allowedRespondents allowedGroups invitations');
  }

  async getRespondentsByIds(respondentIds: string[]) {
    const { Respondent } = await import('../models/Respondent');
    return Respondent.find({ _id: { $in: respondentIds } }).select('mail name');
  }

  async create(data: Partial<ISurveyRespondents>) {
    const surveyRespondents = new SurveyRespondents(data);
    return surveyRespondents.save();
  }

  async update(surveyId: string, updateData: Partial<ISurveyRespondents>) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      updateData,
      { new: true, upsert: true }
    )
      .populate('allowedRespondents', 'name mail gender employeeId')
      .populate('allowedGroups', 'name description');
  }

  async softDelete(id: string) {
    return SurveyRespondents.findByIdAndDelete(id);
  }

  async hardDelete(id: string) {
    return SurveyRespondents.findByIdAndDelete(id);
  }

  async deleteBySurveyId(surveyId: string) {
    return SurveyRespondents.findOneAndDelete({ surveyId });
  }

  async addRespondents(surveyId: string, respondentIds: string[]) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      {
        $addToSet: {
          allowedRespondents: { $each: respondentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true, upsert: true }
    ).populate('allowedRespondents', 'name mail gender employeeId');
  }

  async removeRespondents(surveyId: string, respondentIds: string[]) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      {
        $pull: {
          allowedRespondents: { $in: respondentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true }
    ).populate('allowedRespondents', 'name mail gender employeeId');
  }

  async addGroups(surveyId: string, groupIds: string[]) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      {
        $addToSet: {
          allowedGroups: { $each: groupIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true, upsert: true }
    ).populate('allowedGroups', 'name description');
  }

  async removeGroups(surveyId: string, groupIds: string[]) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      {
        $pull: {
          allowedGroups: { $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true }
    ).populate('allowedGroups', 'name description');
  }

  async addInvitation(surveyId: string, invitation: IInvitation) {
    return SurveyRespondents.findOneAndUpdate(
      { surveyId },
      {
        $push: {
          invitations: invitation,
        },
      },
      { new: true, upsert: true }
    );
  }

  async updateInvitationStatus(
    surveyId: string,
    respondentId: string,
    status: 'pending' | 'sent' | 'failed'
  ) {
    return SurveyRespondents.findOneAndUpdate(
      {
        surveyId,
        'invitations.respondentId': respondentId,
      },
      {
        $set: {
          'invitations.$.status': status,
          'invitations.$.sentAt': new Date(),
        },
      },
      { new: true }
    );
  }

  async getInvitations(surveyId: string) {
    const surveyRespondents = await SurveyRespondents.findOne({ surveyId })
      .select('invitations')
      .populate('invitations.respondentId', 'name mail');
    return surveyRespondents?.invitations || [];
  }

  async countRespondents(surveyId: string) {
    const surveyRespondents = await SurveyRespondents.findOne({ surveyId });
    if (!surveyRespondents) {
      return 0;
    }
    return surveyRespondents.allowedRespondents.length;
  }

  async countGroups(surveyId: string) {
    const surveyRespondents = await SurveyRespondents.findOne({ surveyId });
    if (!surveyRespondents) {
      return 0;
    }
    return surveyRespondents.allowedGroups.length;
  }
}

