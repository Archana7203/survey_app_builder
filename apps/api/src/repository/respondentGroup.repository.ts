import { RespondentGroup, IRespondentGroup } from '../models/RespondentGroup';
import mongoose from 'mongoose';

export class RespondentGroupRepository {
  async list(
    createdBy: string,
    skip = 0,
    limit = 10,
    filters?: {
      search?: string;
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
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return RespondentGroup.find(query)
      .populate('members', 'name mail gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async count(
    createdBy: string,
    filters?: {
      search?: string;
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
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return RespondentGroup.countDocuments(query);
  }

  async getById(groupId: string) {
    return RespondentGroup.findById(groupId).populate('members', 'name mail gender');
  }

  async getByIdAndCreator(groupId: string, createdBy: string) {
    return RespondentGroup.findOne({
      _id: groupId,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    }).populate('members', 'name mail gender');
  }

  async create(groupData: Partial<IRespondentGroup>) {
    // Check if a group with the same name exists (even if archived)
    const existing = await RespondentGroup.findOne({
      createdBy: groupData.createdBy,
      name: groupData.name,
    });

    if (existing) {
      // If exists and is archived, restore it and update with new data
      if (existing.isArchived) {
        const restored = await RespondentGroup.findByIdAndUpdate(
          existing._id,
          { ...groupData, isArchived: false },
          { new: true }
        ).populate('members', 'name mail gender');
        if (!restored) {
          throw new Error('Failed to restore archived group');
        }
        return restored;
      }
      // If exists and not archived, throw duplicate error
      throw new Error('Group with this name already exists');
    }

    const group = new RespondentGroup(groupData);
    return group.save();
  }

  async update(groupId: string, updateData: Partial<IRespondentGroup>) {
    return RespondentGroup.findByIdAndUpdate(groupId, updateData, { new: true }).populate(
      'members',
      'name mail gender'
    );
  }

  async softDelete(groupId: string) {
    return RespondentGroup.findByIdAndUpdate(
      groupId,
      { isArchived: true },
      { new: true }
    );
  }

  async hardDelete(groupId: string) {
    return RespondentGroup.findByIdAndDelete(groupId);
  }

  async addMembers(groupId: string, memberIds: string[]) {
    return RespondentGroup.findByIdAndUpdate(
      groupId,
      {
        $addToSet: {
          members: { $each: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true }
    ).populate('members', 'name mail gender');
  }

  async removeMembers(groupId: string, memberIds: string[]) {
    return RespondentGroup.findByIdAndUpdate(
      groupId,
      {
        $pull: {
          members: { $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { new: true }
    ).populate('members', 'name mail gender');
  }

  async duplicate(groupId: string, createdBy: string, newName: string) {
    const originalGroup = await this.getById(groupId);
    if (!originalGroup) {
      return null;
    }

    const duplicatedGroup = new RespondentGroup({
      name: newName,
      description: originalGroup.description,
      members: originalGroup.members,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      isArchived: false,
    });

    return duplicatedGroup.save();
  }
}

