import { RespondentGroupRepository } from '../repository/respondentGroup.repository';
import { IRespondentGroup } from '../models/RespondentGroup';
import log from '../logger';

export class RespondentGroupService {
  private readonly repo = new RespondentGroupRepository();

  /**
   * List groups with pagination (defaults: page=1, limit=20)
   * Enforces ownership - only returns groups created by current user
   */
  async list(
    createdBy: string,
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      isArchived?: boolean;
    }
  ) {
    log.info('Listing respondent groups', 'list', { createdBy, page, limit, filters });
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (page - 1) * safeLimit;

    const groups = await this.repo.list(createdBy, skip, safeLimit, filters);
    const total = await this.repo.count(createdBy, filters);

    log.info('Groups retrieved', 'list', {
      createdBy,
      count: groups.length,
      total,
    });

    return {
      groups,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: page * safeLimit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get group by ID with ownership check
   */
  async getById(groupId: string, createdBy: string) {
    log.debug('Fetching group by ID', 'getById', { groupId, createdBy });
    const group = await this.repo.getByIdAndCreator(groupId, createdBy);

    if (!group) {
      log.warn('Group not found or no permission', 'getById', {
        groupId,
        createdBy,
      });
      throw new Error('Group not found or no permission');
    }

    return group;
  }

  /**
   * Create new group
   */
  async create(
    createdBy: string,
    data: {
      name: string;
      description?: string;
      members?: string[];
    }
  ) {
    log.info('Creating respondent group', 'create', { createdBy, name: data.name });

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      log.warn('Validation failed: Name is required', 'create', { createdBy });
      throw new Error('Group name is required');
    }

    try {
      const group = await this.repo.create({
        name: data.name,
        description: data.description,
        members: data.members || [],
        createdBy,
        isArchived: false,
      });

      if (!group) {
        throw new Error('Failed to create group');
      }

      log.info('Group created successfully', 'create', {
        createdBy,
        groupId: group._id,
      });

      return group;
    } catch (error: any) {
      if (error.code === 11000) {
        log.warn('Duplicate group name detected', 'create', {
          createdBy,
          error: error.message,
        });
        throw new Error('Group with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Update group with ownership check
   */
  async update(
    groupId: string,
    createdBy: string,
    updateData: Partial<IRespondentGroup>
  ) {
    log.info('Updating group', 'update', { groupId, createdBy });

    // Check ownership
    await this.getById(groupId, createdBy);

    // Prevent updating createdBy and isArchived through this method
    const safeUpdates = { ...updateData };
    delete safeUpdates.createdBy;
    delete safeUpdates.isArchived;

    const updated = await this.repo.update(groupId, safeUpdates);

    log.info('Group updated successfully', 'update', {
      groupId,
      createdBy,
    });

    return updated;
  }

  /**
   * Soft delete group (sets isArchived=true)
   * Enforces ownership check
   */
  async softDelete(groupId: string, createdBy: string) {
    log.info('Soft deleting group', 'softDelete', { groupId, createdBy });

    // Check ownership
    await this.getById(groupId, createdBy);

    const deleted = await this.repo.softDelete(groupId);

    log.info('Group soft deleted successfully', 'softDelete', {
      groupId,
      createdBy,
    });

    return deleted;
  }

  /**
   * Hard delete group (permanent)
   * Enforces ownership check
   */
  async hardDelete(groupId: string, createdBy: string) {
    log.info('Hard deleting group', 'hardDelete', { groupId, createdBy });

    // Check ownership
    await this.getById(groupId, createdBy);

    await this.repo.hardDelete(groupId);

    log.info('Group hard deleted successfully', 'hardDelete', {
      groupId,
      createdBy,
    });

    return { message: 'Group deleted permanently' };
  }

  /**
   * Add members to group
   */
  async addMembers(groupId: string, createdBy: string, memberIds: string[]) {
    log.info('Adding members to group', 'addMembers', {
      groupId,
      createdBy,
      count: memberIds.length,
    });

    // Check ownership
    await this.getById(groupId, createdBy);

    if (!memberIds || memberIds.length === 0) {
      throw new Error('No member IDs provided');
    }

    const updated = await this.repo.addMembers(groupId, memberIds);

    log.info('Members added successfully', 'addMembers', {
      groupId,
      createdBy,
    });

    return updated;
  }

  /**
   * Remove members from group
   */
  async removeMembers(groupId: string, createdBy: string, memberIds: string[]) {
    log.info('Removing members from group', 'removeMembers', {
      groupId,
      createdBy,
      count: memberIds.length,
    });

    // Check ownership
    await this.getById(groupId, createdBy);

    if (!memberIds || memberIds.length === 0) {
      throw new Error('No member IDs provided');
    }

    const updated = await this.repo.removeMembers(groupId, memberIds);

    log.info('Members removed successfully', 'removeMembers', {
      groupId,
      createdBy,
    });

    return updated;
  }

  /**
   * Duplicate group
   */
  async duplicate(groupId: string, createdBy: string, newName?: string) {
    log.info('Duplicating group', 'duplicate', { groupId, createdBy, newName });

    // Check ownership
    const originalGroup = await this.getById(groupId, createdBy);

    const duplicateName = newName || `${originalGroup.name} (Copy)`;

    const duplicated = await this.repo.duplicate(groupId, createdBy, duplicateName);

    if (!duplicated) {
      throw new Error('Failed to duplicate group');
    }

    log.info('Group duplicated successfully', 'duplicate', {
      groupId,
      createdBy,
      newGroupId: duplicated._id,
    });

    return duplicated;
  }
}

