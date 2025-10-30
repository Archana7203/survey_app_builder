import { Respondent, IRespondent } from '../models/Respondent';
import mongoose from 'mongoose';

export class RespondentRepository {
  async list(
    createdBy: string,
    skip = 0,
    limit = 10,
    filters?: {
      search?: string;
      gender?: 'male' | 'female' | 'other';
      isArchived?: boolean;
    }
  ) {
    const query: any = {
      createdBy: new mongoose.Types.ObjectId(createdBy),
      isArchived: filters?.isArchived ?? false,
    };

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { mail: { $regex: filters.search, $options: 'i' } },
        { employeeId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters?.gender) {
      query.gender = filters.gender;
    }

    return Respondent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count(
    createdBy: string,
    filters?: {
      search?: string;
      gender?: 'male' | 'female' | 'other';
      isArchived?: boolean;
    }
  ) {
    const query: any = {
      createdBy: new mongoose.Types.ObjectId(createdBy),
      isArchived: filters?.isArchived ?? false,
    };

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { mail: { $regex: filters.search, $options: 'i' } },
        { employeeId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters?.gender) {
      query.gender = filters.gender;
    }

    return Respondent.countDocuments(query);
  }

  async getById(respondentId: string) {
    return Respondent.findById(respondentId);
  }

  async getByIdAndCreator(respondentId: string, createdBy: string) {
    return Respondent.findOne({
      _id: respondentId,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
  }

  async create(respondentData: Partial<IRespondent>) {
    // Check if a respondent with the same mail exists (even if archived)
    const existing = await Respondent.findOne({
      createdBy: respondentData.createdBy,
      mail: respondentData.mail,
    });

    if (existing) {
      // If exists and is archived, restore it and update with new data
      if (existing.isArchived) {
        const restored = await Respondent.findByIdAndUpdate(
          existing._id,
          { ...respondentData, isArchived: false },
          { new: true }
        );
        if (!restored) {
          throw new Error('Failed to restore archived respondent');
        }
        return restored;
      }
      // If exists and not archived, throw duplicate error
      throw new Error('Respondent with this email already exists');
    }

    const respondent = new Respondent(respondentData);
    return respondent.save();
  }

  async update(respondentId: string, updateData: Partial<IRespondent>) {
    return Respondent.findByIdAndUpdate(respondentId, updateData, { new: true });
  }

  async softDelete(respondentId: string) {
    return Respondent.findByIdAndUpdate(
      respondentId,
      { isArchived: true },
      { new: true }
    );
  }

  async hardDelete(respondentId: string) {
    return Respondent.findByIdAndDelete(respondentId);
  }

  /**
   * Upsert multiple Azure profiles by (createdBy, azureId)
   * If a profile already exists, it will be updated; otherwise, it will be created
   */
  async upsertManyAzure(
    createdBy: string,
    profiles: Array<{
      azureId: string;
      name: string;
      mail: string;
      gender: 'male' | 'female' | 'other';
      userPrincipalName: string;
      accountEnabled: boolean;
      employeeId: string;
    }>
  ) {
    const operations = profiles.map((profile) => ({
      updateOne: {
        filter: {
          createdBy: new mongoose.Types.ObjectId(createdBy),
          azureId: profile.azureId,
        },
        update: {
          $set: {
            name: profile.name,
            mail: profile.mail,
            gender: profile.gender,
            userPrincipalName: profile.userPrincipalName,
            accountEnabled: profile.accountEnabled,
            employeeId: profile.employeeId,
          },
          $setOnInsert: {
            createdBy: new mongoose.Types.ObjectId(createdBy),
            isArchived: false,
          },
        },
        upsert: true,
      },
    }));

    return Respondent.bulkWrite(operations);
  }

  async findByAzureIds(createdBy: string, azureIds: string[]) {
    return Respondent.find({
      createdBy: new mongoose.Types.ObjectId(createdBy),
      azureId: { $in: azureIds },
    });
  }

  async findByMails(createdBy: string, mails: string[]) {
    return Respondent.find({
      createdBy: new mongoose.Types.ObjectId(createdBy),
      mail: { $in: mails },
    });
  }
}

