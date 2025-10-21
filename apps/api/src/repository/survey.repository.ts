// repository/survey.repository.ts
import { Survey } from '../models/Survey';
import { Response } from '../models/Response';
import mongoose from 'mongoose';

export class SurveyRepository {
  async findById(surveyId: string) {
    return Survey.findById(surveyId);
  }

  async findByIdAndCreator(surveyId: string, userId: string) {
    return Survey.findOne({ _id: surveyId, createdBy: userId });
  }

  async findBySlug(slug: string) {
    return Survey.findOne({ slug });
  }

  async findBySlugPublished(slug: string) {
    return Survey.findOne({
      slug,
      status: { $in: ['published', 'live'] }, // Accept both statuses
    });
  }

  async deleteById(surveyId: string) {
    return Survey.findByIdAndDelete(surveyId);
  }

  async findAllByCreator(userId: string, skip = 0, limit = 10) {
    return Survey.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'responses',
          localField: '_id',
          foreignField: 'survey',
          as: 'responses',
        },
      },
      {
        $addFields: {
          responseCount: {
            $size: {
              $filter: {
                input: '$responses',
                cond: { $eq: ['$$this.status', 'Completed'] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          slug: 1,
          status: 1,
          closeDate: 1,
          createdAt: 1,
          updatedAt: 1,
          responseCount: 1,
          allowedRespondents: 1,
          locked: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
  }

  async countByCreator(userId: string) {
    return Survey.countDocuments({ createdBy: userId });
  }

  async createSurvey(surveyData: any) {
    const survey = new Survey(surveyData);
    return survey.save();
  }

  async updateSurvey(surveyId: string, updateData: any) {
    return Survey.findByIdAndUpdate(surveyId, updateData, { new: true });
  }

  async deleteSurvey(surveyId: string) {
    return Survey.findByIdAndDelete(surveyId);
  }

  async countResponses(surveyId: string) {
    return Response.countDocuments({ survey: surveyId });
  }
}
