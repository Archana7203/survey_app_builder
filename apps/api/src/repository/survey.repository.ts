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

  async findAllByCreator(
    userId: string, 
    skip = 0, 
    limit = 10, 
    filters?: { 
      status?: string; 
      search?: string; 
      dateFrom?: string; 
      dateTo?: string; 
      dateField?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const matchStage: any = { 
      createdBy: new mongoose.Types.ObjectId(userId)
    };
    
    // Status filter (draft, published, live, closed, archived)
    // If no status filter is provided, exclude archived surveys
    if (filters?.status) {
      matchStage.status = filters.status;
    } else {
      matchStage.status = { $ne: 'archived' };
    }
    
    // Search filter (title OR description)
    if (filters?.search) {
      matchStage.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Date range filters
    if (filters?.dateFrom && filters?.dateField) {
      matchStage[filters.dateField] = { 
        ...matchStage[filters.dateField],
        $gte: new Date(filters.dateFrom) 
      };
    }
    
    if (filters?.dateTo && filters?.dateField) {
      matchStage[filters.dateField] = { 
        ...matchStage[filters.dateField],
        $lte: new Date(filters.dateTo) 
      };
    }

    return Survey.aggregate([
      { $match: matchStage },
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
          locked: 1,
        },
      },
      { 
        $sort: this.getSortStage(filters?.sortBy, filters?.sortOrder)
      },
      { $skip: skip },
      { $limit: limit },
    ]);
  }

  private getSortStage(sortBy?: string, sortOrder?: 'asc' | 'desc'): Record<string, 1 | -1> {
    const order = sortOrder === 'asc' ? 1 : -1;
    const validSortFields = ['title', 'status', 'createdAt', 'updatedAt', 'closeDate'];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    return { [sortField]: order };
  }

  async countByCreator(
    userId: string, 
    filters?: { 
      status?: string; 
      search?: string; 
      dateFrom?: string; 
      dateTo?: string; 
      dateField?: string; 
    }
  ) {
    const query: any = { 
      createdBy: userId
    };
    
    // Status filter (draft, published, live, closed, archived)
    // If no status filter is provided, exclude archived surveys
    if (filters?.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'archived' };
    }
    
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters?.dateFrom && filters?.dateField) {
      query[filters.dateField] = { 
        ...query[filters.dateField],
        $gte: new Date(filters.dateFrom) 
      };
    }
    
    if (filters?.dateTo && filters?.dateField) {
      query[filters.dateField] = { 
        ...query[filters.dateField],
        $lte: new Date(filters.dateTo) 
      };
    }
    
    return Survey.countDocuments(query);
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
