import { RespondentRepository } from '../repository/respondent.repository';
import { IRespondent } from '../models/Respondent';
import log from '../logger';

export class RespondentService {
  private readonly repo = new RespondentRepository();

  /**
   * List respondents with pagination (defaults: page=1, limit=20)
   * Enforces ownership - only returns respondents created by current user
   */
  async list(
    createdBy: string,
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      gender?: 'male' | 'female' | 'other';
      isArchived?: boolean;
    }
  ) {
    log.info('Listing respondents', 'list', { createdBy, page, limit, filters });
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (page - 1) * safeLimit;

    const respondents = await this.repo.list(createdBy, skip, safeLimit, filters);
    const total = await this.repo.count(createdBy, filters);

    log.info('Respondents retrieved', 'list', {
      createdBy,
      count: respondents.length,
      total,
    });

    return {
      respondents,
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
   * Get respondent by ID with ownership check
   */
  async getById(respondentId: string, createdBy: string) {
    log.debug('Fetching respondent by ID', 'getById', { respondentId, createdBy });
    const respondent = await this.repo.getByIdAndCreator(respondentId, createdBy);

    if (!respondent) {
      log.warn('Respondent not found or no permission', 'getById', {
        respondentId,
        createdBy,
      });
      throw new Error('Respondent not found or no permission');
    }

    return respondent;
  }

  /**
   * Create new respondent
   */
  async create(
    createdBy: string,
    data: {
      azureId?: string;
      name: string;
      mail: string;
      gender: 'male' | 'female' | 'other';
      userPrincipalName?: string;
      accountEnabled?: boolean;
      employeeId?: string;
    }
  ) {
    log.info('Creating respondent', 'create', { createdBy, mail: data.mail });

    // Validate required fields
    if (!data.name || !data.mail) {
      log.warn('Validation failed: Missing required fields', 'create', { createdBy });
      throw new Error('Name and mail are required');
    }

    // Check for existing respondent with same email
    const existingByMail = await this.repo.findByMails(createdBy, [data.mail]);
    if (existingByMail.length > 0 && !existingByMail[0].isArchived) {
      log.warn('Duplicate email detected', 'create', { createdBy, mail: data.mail });
      throw new Error(`A profile with email "${data.mail}" already exists. Please use a different email or edit the existing profile.`);
    }

    // Check for existing respondent with same azureId (if provided)
    if (data.azureId && data.azureId.trim() !== '') {
      const existingByAzureId = await this.repo.findByAzureIds(createdBy, [data.azureId]);
      if (existingByAzureId.length > 0 && !existingByAzureId[0].isArchived) {
        log.warn('Duplicate azureId detected', 'create', { createdBy, azureId: data.azureId });
        throw new Error(`A profile with Azure ID "${data.azureId}" already exists.`);
      }
    }

    try {
      // Normalize azureId: if empty string, set to undefined for sparse index
      const normalizedData = {
        ...data,
        azureId: data.azureId && data.azureId.trim() !== '' ? data.azureId : undefined,
        createdBy,
        isArchived: false,
      };

      const respondent = await this.repo.create(normalizedData);

      if (!respondent) {
        throw new Error('Failed to create respondent');
      }

      log.info('Respondent created successfully', 'create', {
        createdBy,
        respondentId: respondent._id,
      });

      return respondent;
    } catch (error: any) {
      if (error.code === 11000) {
        // MongoDB duplicate key error - determine which field caused it
        const keyPattern = error.keyPattern || {};
        if (keyPattern.mail) {
          log.warn('Duplicate email detected (MongoDB index)', 'create', { createdBy, mail: data.mail });
          throw new Error(`A profile with email "${data.mail}" already exists. Please use a different email or edit the existing profile.`);
        } else if (keyPattern.azureId) {
          log.warn('Duplicate azureId detected (MongoDB index)', 'create', { createdBy, azureId: data.azureId });
          throw new Error(`A profile with Azure ID "${data.azureId}" already exists.`);
        } else {
          log.warn('Duplicate respondent detected (MongoDB index)', 'create', { createdBy, error: error.message });
          throw new Error('A profile with these details already exists.');
        }
      }
      // Re-throw if error message already set by our checks
      if (error.message.includes('already exists') || error.message.includes('Please use')) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Update respondent with ownership check
   */
  async update(
    respondentId: string,
    createdBy: string,
    updateData: Partial<IRespondent>
  ) {
    log.info('Updating respondent', 'update', { respondentId, createdBy });

    // Check ownership
    const existing = await this.getById(respondentId, createdBy);

    // Prevent updating createdBy and isArchived through this method
    const safeUpdates = { ...updateData };
    delete safeUpdates.createdBy;
    delete safeUpdates.isArchived;

    const updated = await this.repo.update(respondentId, safeUpdates);

    log.info('Respondent updated successfully', 'update', {
      respondentId,
      createdBy,
    });

    return updated;
  }

  /**
   * Soft delete respondent (sets isArchived=true)
   * Enforces ownership check
   */
  async softDelete(respondentId: string, createdBy: string) {
    log.info('Soft deleting respondent', 'softDelete', { respondentId, createdBy });

    // Check ownership
    await this.getById(respondentId, createdBy);

    const deleted = await this.repo.softDelete(respondentId);

    log.info('Respondent soft deleted successfully', 'softDelete', {
      respondentId,
      createdBy,
    });

    return deleted;
  }

  /**
   * Hard delete respondent (permanent)
   * Enforces ownership check
   */
  async hardDelete(respondentId: string, createdBy: string) {
    log.info('Hard deleting respondent', 'hardDelete', { respondentId, createdBy });

    // Check ownership
    await this.getById(respondentId, createdBy);

    await this.repo.hardDelete(respondentId);

    log.info('Respondent hard deleted successfully', 'hardDelete', {
      respondentId,
      createdBy,
    });

    return { message: 'Respondent deleted permanently' };
  }

  /**
   * Upsert multiple Azure profiles
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
    log.info('Upserting Azure profiles', 'upsertManyAzure', {
      createdBy,
      count: profiles.length,
    });

    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles provided');
    }

    const result = await this.repo.upsertManyAzure(createdBy, profiles);

    log.info('Azure profiles upserted successfully', 'upsertManyAzure', {
      createdBy,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    });

    return {
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      message: 'Profiles imported successfully',
    };
  }

  /**
   * Find respondents by Azure IDs
   */
  async findByAzureIds(createdBy: string, azureIds: string[]) {
    log.debug('Finding respondents by Azure IDs', 'findByAzureIds', {
      createdBy,
      count: azureIds.length,
    });
    return this.repo.findByAzureIds(createdBy, azureIds);
  }

  /**
   * Find respondents by email addresses
   */
  async findByMails(createdBy: string, mails: string[]) {
    log.debug('Finding respondents by mails', 'findByMails', {
      createdBy,
      count: mails.length,
    });
    return this.repo.findByMails(createdBy, mails);
  }
}

