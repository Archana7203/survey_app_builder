import dotenv from 'dotenv';
dotenv.config();
import { SurveyRepository } from '../repository/survey.repository';
import { ResponseRepository } from '../repository/response.repository';
import { SurveyRespondentsService } from './surveyRespondents.service';
import { generateUniqueSlug } from '../utils/slug';
import { generateSurveyToken, sendSurveyInvite } from '../utils/email';
import mongoose from 'mongoose';
import validator from 'validator';
import log from '../logger'

//Helper
const validatePage = (page: any, index: number) => {
  if (!page || typeof page !== 'object') {
    throw new Error(`Validation: Invalid page data at index ${index}`);
  }
  if (!Array.isArray(page.questions)) {
    throw new TypeError(
      `Validation: Questions must be an array at page ${index + 1}`
    );
  }
  if (!Array.isArray(page.branching)) {
    throw new TypeError(
      `Validation: Branching must be an array at page ${index + 1}`
    );
  }
};

function validateSurveyUpdate(updateData: any): void {
  if (updateData.title !== undefined) {
    if (
      !updateData.title ||
      typeof updateData.title !== 'string' ||
      updateData.title.trim() === ''
    ) {
      throw new Error('Validation: Title cannot be empty');
    }
  }

  if (updateData.pages !== undefined) {
    if (!Array.isArray(updateData.pages))
      throw new Error('Validation: Pages must be an array');

    for (const [i, page] of updateData.pages.entries()) {
      validatePage(page, i);
    }
  }
}

export class SurveyService {
  private readonly repo = new SurveyRepository();
  private readonly responseRepo = new ResponseRepository();
  private readonly surveyRespondentsService = new SurveyRespondentsService();
  // 1. Get all surveys for authenticated user
  async getAllSurveys(
    userId: string, 
    page = 1, 
    limit = 10, 
    filters?: { 
      status?: string; 
      search?: string; 
      dateFrom?: string; 
      dateTo?: string; 
      dateField?: string; 
    }
  ) {
    log.info('Fetching all surveys for user', 'getAllSurveys', { userId, page, limit, filters });
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (page - 1) * safeLimit;
    
    const surveysWithResponses: any[] = await this.repo.findAllByCreator(
      userId,
      skip,
      safeLimit,
      filters
    );
    
    // Apply just-in-time transitions (e.g., auto-close on endDate) for each survey
    for (const s of surveysWithResponses) {
      try {
        await this.ensureJustInTimeTransitions(s, userId, s._id?.toString?.() ?? '');
        console.log(s.status);
      } catch {}
    }
    
    const totalSurveys = await this.repo.countByCreator(userId, filters);
    
    log.info('Successfully retrieved surveys', 'getAllSurveys', {
      userId,
      count: surveysWithResponses.length,
      totalSurveys
    });
    
    return { surveysWithResponses, totalSurveys, page, limit: safeLimit };
  }


  // 2. Create new survey
  async createSurvey(userId: string, data: any) {
    log.info('Creating new survey', 'createSurvey', { userId, title: data.title });
    if (
      !data.title ||
      typeof data.title !== 'string' ||
      data.title.trim() === ''
    ) {
      log.warn('Survey validation failed: Missing or invalid title', 'createSurvey', { userId });
      throw new Error('Validation: Title is required');
    }
    if (data.pages !== undefined) {
      if (!Array.isArray(data.pages)) {
        log.warn('Survey validation failed: Pages must be array', 'createSurvey', { userId });
        throw new Error('Validation: Pages must be an array');
      }
      for (let i = 0; i < data.pages.length; i++) {
        const page = data.pages[i];
        if (!page || typeof page !== 'object') {
          log.warn('Survey validation failed: Invalid page data', 'createSurvey', { 
            userId, 
            pageIndex: i 
          });
          throw new Error(`Validation: Invalid page data at index ${i}`);
        }
        if (!Array.isArray(page.questions)) {
          log.warn('Survey validation failed: Questions must be array', 'createSurvey', { 
            userId, 
            pageIndex: i 
          });
          throw new Error(
            `Validation: Questions must be an array at page ${i + 1}`
          );
        }
        if (!Array.isArray(page.branching)) {
          log.warn('Survey validation failed: Branching must be array', 'createSurvey', { 
            userId, 
            pageIndex: i 
          });
          throw new Error(
            `Validation: Branching must be an array at page ${i + 1}`
          );
        }
      }
    }
    const slug = await generateUniqueSlug(data.title);
    log.debug('Generated unique slug', 'createSurvey', { userId, slug });
    const survey = await this.repo.createSurvey({
      ...data,
      slug,
      status: 'draft',
      createdBy: userId,
    });
    log.info('Survey created successfully', 'createSurvey', { 
      userId, 
      surveyId: survey._id, 
      slug 
    });
    return survey;
  }

  // 3. Get survey by ID (creator)
  async getSurveyById(userId: string, surveyId: string) {
    log.debug('Fetching survey by ID', 'getSurveyById', { userId, surveyId });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found or user lacks permission', 'getSurveyById', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found or no permission');
    }
    // Just-in-time status transitions without background job
    await this.ensureJustInTimeTransitions(survey, userId, surveyId);
    return survey;
  }

  // 4. Get survey by slug (preview/internal)
  async getSurveyBySlug(slug: string) {
    log.debug('Fetching survey by slug', 'getSurveyBySlug', { slug });
    const survey = await this.repo.findBySlug(slug);
    if (!survey) {
      log.warn('Survey not found by slug', 'getSurveyBySlug', { slug });
      throw new Error('Survey not found');
    }
    await this.ensureJustInTimeTransitions(survey, survey.createdBy?.toString?.() ?? 'unknown', survey._id?.toString?.() ?? '');
    return survey;
  }

  // 5. Get survey by ID (preview/internal)
  async getSurveyByObjectId(id: string) {
    log.debug('Fetching survey by object ID', 'getSurveyByObjectId', { id });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      log.warn('Invalid survey ID format', 'getSurveyByObjectId', { id });
      throw new Error('Invalid survey ID format');
    }
    const survey = await this.repo.findById(id);
    if (!survey) {
      log.warn('Survey not found by object ID', 'getSurveyByObjectId', { id });
      throw new Error('Survey not found');
    }
    await this.ensureJustInTimeTransitions(survey, survey.createdBy?.toString?.() ?? 'unknown', id);
    return survey;
  }

  // 6. Get public survey for respondents
  async getPublicSurvey(slug: string) {
    log.info('Fetching public survey', 'getPublicSurvey', { slug });
    const survey = await this.repo.findBySlugPublished(slug);
    if (!survey) {
      log.warn('Public survey not found or not accessible', 'getPublicSurvey', { slug });
      throw new Error('Survey not found or not accessible');
    }
    // Treat endDate as the single source of truth
    const now = new Date();
    if (survey.endDate && now >= new Date(survey.endDate)) {
      // Close immediately for public path; persist status
      const originalStatus = survey.status;
      survey.status = 'closed';
      (survey as any).closeDate = survey.endDate;
      await this.handleStatusTransitions(survey, originalStatus, 'closed', survey.createdBy?.toString?.() ?? 'unknown', survey._id?.toString?.() ?? '');
      log.warn('Survey is closed (endDate reached)', 'getPublicSurvey', { slug, endDate: survey.endDate });
      throw new Error('This survey is closed');
    }
    return survey;
  }

  // Helper: Apply immediate transitions on read
  private async ensureJustInTimeTransitions(survey: any, userId: string, surveyId: string): Promise<void> {
    const now = new Date();
    // Auto-close if endDate passed (takes precedence)
    if (survey.endDate && now >= new Date(survey.endDate) && (survey.status === 'live' || survey.status === 'published')) {
      const originalStatus = survey.status;
      survey.status = 'closed';
      (survey as any).closeDate = survey.endDate;
      await this.handleStatusTransitions(survey, originalStatus, 'closed', userId, surveyId);
      return;
    }
    // Auto-live if published and startDate passed
    if (survey.status === 'published' && survey.startDate && now >= new Date(survey.startDate)) {
      survey.status = 'live';
      await this.handleLiveTransition(survey, userId, surveyId);
      // Optional: immediately close if endDate already passed
      if (survey.endDate && now >= new Date(survey.endDate)) {
        const originalStatus = 'live';
        survey.status = 'closed';
        (survey as any).closeDate = survey.endDate;
        await this.handleStatusTransitions(survey, originalStatus, 'closed', userId, surveyId);
      }
    }
  }

  // 7. Get allowed respondents
  async getRespondents(userId: string, surveyId: string) {
    log.debug('Fetching respondents', 'getRespondents', { userId, surveyId });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for fetching respondents', 'getRespondents', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    
    const surveyRespondents = await this.surveyRespondentsService.getBySurveyId(surveyId);
    const count = surveyRespondents ? 
      (surveyRespondents.allowedRespondents?.length || 0) + (surveyRespondents.allowedGroups?.length || 0) : 0;
    
    log.debug('Respondents retrieved', 'getRespondents', { 
      userId, 
      surveyId, 
      count 
    });
    return surveyRespondents;
  }

  // 8. Add respondent (deprecated - use SurveyRespondentsService instead)
  // This method is kept for backward compatibility but should be migrated
  async addRespondent(userId: string, surveyId: string, respondentId: string) {
    log.info('Adding respondent', 'addRespondent', { userId, surveyId, respondentId });
    
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for adding respondent', 'addRespondent', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }

    // Use the new service to add respondent
    await this.surveyRespondentsService.addRespondents(surveyId, [respondentId]);
    
    log.info('Respondent added successfully', 'addRespondent', { 
      userId, 
      surveyId, 
      respondentId 
    });

    return { message: 'Respondent added successfully' };
  }

  // 9. Remove respondent
  async removeRespondent(userId: string, surveyId: string, respondentId: string) {
    log.info('Removing respondent', 'removeRespondent', { userId, surveyId, respondentId });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for removing respondent', 'removeRespondent', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    
    // Use the new service to remove respondent
    await this.surveyRespondentsService.removeRespondents(surveyId, [respondentId]);
    
    const remainingCount = await this.surveyRespondentsService.countRespondents(surveyId);
    
    log.info('Respondent removed successfully', 'removeRespondent', { 
      userId, 
      surveyId, 
      respondentId, 
      remainingCount 
    });
    return { message: 'Respondent removed successfully' };
  }

  // 10. Send invitations
  async sendInvitations(userId: string, surveyId: string) {
    log.info('Sending invitations', 'sendInvitations', { userId, surveyId });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for sending invitations', 'sendInvitations', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }

    // Only send emails if survey is live
    if (survey.status !== 'live') {
      log.warn('Cannot send invitations - survey is not live', 'sendInvitations', { 
        userId, 
        surveyId,
        status: survey.status
      });
      throw new Error('Survey must be live to send invitations');
    }

    // Get all respondent emails using the new service
    const allEmails = await this.surveyRespondentsService.getAllRespondentEmails(surveyId);
    
    if (!allEmails || allEmails.length === 0) {
      log.warn('No respondents to send invitations to', 'sendInvitations', { 
        userId, 
        surveyId 
      });
      throw new Error('No respondents to send invitations to');
    }

    // Get invitations to check who already received emails
    const invitations = await this.surveyRespondentsService.getInvitations(surveyId);
    const sentEmails = new Set(
      invitations
        .filter((inv: any) => inv.status === 'sent')
        .map((inv: any) => inv.respondentId?.mail)
        .filter(Boolean)
    );

    const newRespondents = allEmails.filter(email => !sentEmails.has(email));

    log.info('Preparing to send invitations', 'sendInvitations', { 
      userId, 
      surveyId, 
      totalRespondents: allEmails.length, 
      alreadySent: sentEmails.size, 
      newRespondents: newRespondents.length 
    });

    const results = await Promise.allSettled(
      newRespondents.map(async (email: string) => {
        try {
          const token = generateSurveyToken(surveyId, email);
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:3000';
          const surveyLink = `${frontendUrl}/s/${survey.slug}?token=${token}`;
          await sendSurveyInvite(email, survey.title, surveyLink);
          
          log.debug('Invitation sent successfully', 'sendInvitations', { 
            email, 
            surveyId 
          });
          return { email, success: true };
        } catch (err: any) {
          log.error('Failed to send invitation', 'sendInvitations', { 
            email, 
            surveyId, 
            error: err.message || 'Unknown error' 
          });
          return {
            email,
            success: false,
            error: err.message || 'Unknown error',
          };
        }
      })
    );

    // Update invitation statuses
    const successfulEmails = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => (r as PromiseFulfilledResult<any>).value.email);
    
    // Note: We would need respondent IDs to update invitation status properly
    // This is a simplified version - in practice, you'd match emails to respondent IDs
    
    if (successfulEmails.length > 0) {
      log.info('Invitations sent and recorded', 'sendInvitations', { 
        userId, 
        surveyId, 
        successCount: successfulEmails.length, 
        totalAttempted: newRespondents.length 
      });
    } else {
      log.warn('No invitations were sent successfully', 'sendInvitations', { 
        userId, 
        surveyId 
      });
    }
    return results.map((r) =>
      r.status === 'fulfilled' ? r.value : { success: false }
    );
  }

  // 11. Get respondent progress
  async getRespondentProgress(
    userId: string,
    surveyId: string,
    page = 1,
    limit = 20
  ) {
    log.info('Fetching respondent progress', 'getRespondentProgress', { 
      userId, 
      surveyId, 
      page, 
      limit 
    });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for fetching progress', 'getRespondentProgress', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    const allResponses = await this.responseRepo.findBySurvey(surveyId);
    const responseMap = new Map(
      allResponses.map((r) => [r.respondentEmail, r])
    );
    
    // Get all respondent emails from the new service
    const respondentEmails = await this.surveyRespondentsService.getAllRespondentEmails(surveyId);
    
    const allRespondents = respondentEmails.map((email) => {
      const response = responseMap.get(email);
      if (response) {
        let progress = 0;
        let completionPercentage = 0;

        if (response.status === 'Completed') {
          progress = survey.pages.length;
          completionPercentage = 100;
        } else if (response.status === 'InProgress') {
          progress = (response.metadata?.lastPageIndex || 0) + 1;
          completionPercentage = Math.round(
            (progress / survey.pages.length) * 100
          );
        }
        return {
          email,
          status: response.status,
          startedAt: response.startedAt,
          lastUpdated: response.startedAt,
          progress,
          totalPages: survey.pages.length,
          timeSpent: response.metadata?.timeSpent || 0,
          pagesVisited: response.metadata?.pagesVisited || [],
          completionPercentage,
        };
      }
      return {
        email,
        status: 'Not Started',
        startedAt: null,
        lastUpdated: null,
        progress: 0,
        totalPages: survey.pages.length,
        timeSpent: 0,
        pagesVisited: [],
        completionPercentage: 0,
      };
    });
    allRespondents.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        Completed: 3,
        InProgress: 2,
        'Not Started': 1,
      };
      const aPriority = statusPriority[a.status] || 0;
      const bPriority = statusPriority[b.status] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      if (a.lastUpdated && b.lastUpdated)
        return (
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      return a.lastUpdated ? -1 : 1;
    });
    const start = (page - 1) * limit;
    log.info('Respondent progress retrieved', 'getRespondentProgress', { 
      userId, 
      surveyId, 
      totalRespondents: allRespondents.length, 
      page 
    });
    return {
      survey: {
        id: survey._id,
        title: survey.title,
        totalPages: survey.pages.length,
        totalRespondents: allRespondents.length,
      },
      respondentProgress: allRespondents.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total: allRespondents.length,
        totalPages: Math.ceil(allRespondents.length / limit),
        hasNext: page * limit < allRespondents.length,
        hasPrev: page > 1,
      },
    };
  }

  // 12. Update survey
  async updateSurvey(userId: string, surveyId: string, updateData: any) {
    log.info('Updating survey', 'updateSurvey', { 
      userId, 
      surveyId, 
      updateFields: Object.keys(updateData) 
    });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for update', 'updateSurvey', { userId, surveyId });
      throw new Error('Survey not found');
    }
    validateSurveyUpdate(updateData);
    const filteredUpdates = this.filterAllowedUpdates(updateData);
    const originalStatus = survey.status;
    const newStatus = filteredUpdates.status;
    log.debug('Survey status transition', 'updateSurvey', { 
      userId, 
      surveyId, 
      originalStatus, 
      newStatus 
    });
    Object.assign(survey, filteredUpdates);
    // If endDate is set to a past or current time, immediately close survey
    if (typeof filteredUpdates.endDate !== 'undefined' && filteredUpdates.endDate) {
      const endDateCandidate = new Date(filteredUpdates.endDate);
      if (!Number.isNaN(endDateCandidate.getTime()) && new Date() >= endDateCandidate) {
        survey.status = 'closed';
        // Keep closeDate equal to endDate for legacy consumers
        (survey as any).closeDate = endDateCandidate;
        await this.handleStatusTransitions(survey, originalStatus, 'closed', userId, surveyId);
        log.info('Survey immediately closed due to past/now endDate on update', 'updateSurvey', {
          userId,
          surveyId,
          endDate: endDateCandidate.toISOString(),
        });
        return survey;
      }
    }
    
    // Check if survey should auto-transition to live based on start date AND time
    if (survey.status === 'published' && survey.startDate && newStatus !== 'live') {
      const now = new Date();
      const startDate = new Date(survey.startDate);
      
      // Check if current time is at or past the scheduled start date and time
      if (now >= startDate) {
        log.info('Auto-transitioning survey to live - start date and time has been reached', 'updateSurvey', {
          userId,
          surveyId,
          startDate: survey.startDate,
          currentTime: now.toISOString()
        });
        survey.status = 'live';
        await this.handleLiveTransition(survey, userId, surveyId);
        log.info('Survey auto-transitioned to live successfully', 'updateSurvey', { 
          userId, 
          surveyId 
        });
        return survey;
      }
    }
    
    // Check if survey should auto-transition from live to closed based on end date AND time
    if (survey.status === 'live' && survey.endDate && newStatus !== 'closed') {
      const now = new Date();
      const endDate = new Date(survey.endDate);
      
      // Check if current time is at or past the scheduled end date and time
      if (now >= endDate) {
        log.info('Auto-transitioning survey to closed - end date and time has been reached', 'updateSurvey', {
          userId,
          surveyId,
          endDate: survey.endDate,
          currentTime: now.toISOString()
        });
        survey.status = 'closed';
        await this.handleStatusTransitions(survey, originalStatus, 'closed', userId, surveyId);
        log.info('Survey auto-transitioned to closed successfully', 'updateSurvey', { 
          userId, 
          surveyId 
        });
        return survey;
      }
    }
    
    await this.handleStatusTransitions(survey, originalStatus, newStatus, userId, surveyId);   
    log.info('Survey updated successfully', 'updateSurvey', { 
      userId, 
      surveyId 
    });  
    return survey;
  }

  // Extract method: Filter allowed update fields
  private filterAllowedUpdates(updateData: any): any {
    const allowedUpdates = new Set([
      'status',
      'title',
      'description',
      'closeDate',
      'startDate',
      'endDate',
      'theme',
      'backgroundColor',
      'textColor',
      'pages',
    ]);
    const filteredUpdates: any = {};
    for (const k of Object.keys(updateData)) {
      if (allowedUpdates.has(k)) {
        filteredUpdates[k] = updateData[k];
      }
    }
    return filteredUpdates;
  }

  // Extract method: Handle all status transitions
  private async handleStatusTransitions(
    survey: any, 
    originalStatus: string, 
    newStatus: string, 
    userId: string, 
    surveyId: string
  ): Promise<void> {
    if (newStatus === 'published' && originalStatus !== 'published') {
      this.handlePublishTransition(survey, userId, surveyId);
    } else if (newStatus === 'draft' && originalStatus === 'published') {
      this.handleDraftTransition(survey, userId, surveyId);
    } else if (newStatus === 'live' && originalStatus !== 'live') {
      await this.handleLiveTransition(survey, userId, surveyId);
      return; // Early return after live transition
    }
    await this.repo.updateSurvey(surveyId, survey);
  }

  // Extract method: Handle publish transition
  private handlePublishTransition(survey: any, userId: string, surveyId: string): void {
    survey.locked = true;
    survey.closeDate = undefined;
    log.info('Survey published and locked', 'updateSurvey', { 
      userId, 
      surveyId 
    });
  }

  // Extract method: Handle draft transition
  private handleDraftTransition(survey: any, userId: string, surveyId: string): void {
    survey.closeDate = new Date();
    log.info('Survey moved to draft with close date', 'updateSurvey', { 
      userId, 
      surveyId, 
      closeDate: survey.closeDate 
    });
  }

  // Extract method: Handle live transition with validations
  private async handleLiveTransition(survey: any, userId: string, surveyId: string): Promise<void> {
    log.info('Survey status changed to live - validating', 'updateSurvey', {
      userId,
      surveyId
    });

    this.validateSurveyCanGoLive(survey, userId, surveyId);

    survey.locked = true;
    log.info('Survey locked for live status', 'updateSurvey', {
      userId,
      surveyId
    });

    await this.repo.updateSurvey(surveyId, survey);

    log.info('Survey is now live - invitations must be sent manually', 'updateSurvey', {
      userId,
      surveyId
    });
  }

  // Extract method: Validate survey can go live
  private validateSurveyCanGoLive(survey: any, userId: string, surveyId: string): void {
    if (
      !survey.pages ||
      survey.pages.length === 0 ||
      !survey.pages.some((page: any) => page.questions && page.questions.length > 0)
    ) {
      log.error('Cannot go live: No questions in survey', 'updateSurvey', {
        userId,
        surveyId
      });
      throw new Error('Cannot go live: Survey must have at least one question');
    }

    if (!survey.startDate) {
      log.error('Cannot go live: Start date not set', 'updateSurvey', {
        userId,
        surveyId
      });
      throw new Error('Cannot go live: Start date is required');
    }
    if (!survey.endDate) {
      log.error('Cannot go live: End date not set', 'updateSurvey', {
        userId,
        surveyId
      });
      throw new Error('Cannot go live: End date is required');
    }
    const now = new Date();
    const startDate = new Date(survey.startDate);
    const endDate = new Date(survey.endDate);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const surveyStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    if (surveyStartDate > todayStart) {
      log.error('Cannot go live: Start date is in the future', 'updateSurvey', {
        userId,
        surveyId,
        startDate: survey.startDate,
        today: todayStart
      });
      throw new Error('Cannot go live before the start date. Start date must be today or earlier.');
    }
    if (endDate <= now) {
      log.error('Cannot go live: Survey has expired', 'updateSurvey', {
        userId,
        surveyId,
        endDate: survey.endDate
      });
      throw new Error('Cannot go live - survey end date has already passed');
    }
    log.info('Survey validation passed for going live', 'updateSurvey', {
      userId,
      surveyId
    });
  }

  // 13. Delete survey
  async deleteSurvey(userId: string, surveyId: string) {
    log.info('Attempting to delete survey', 'deleteSurvey', { userId, surveyId });  
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for deletion', 'deleteSurvey', { userId, surveyId });
      throw new Error('Survey not found');
    }
    const responseCount = await this.responseRepo.countBySurvey(surveyId);
    if (responseCount > 0) {
      log.warn('Cannot delete survey with responses', 'deleteSurvey', { 
        userId, 
        surveyId, 
        responseCount 
      });
      throw new Error(`Cannot delete survey with ${responseCount} response(s)`);
    }
    
    // Delete associated survey respondents
    await this.surveyRespondentsService.deleteBySurveyId(surveyId);
    
    await this.repo.deleteSurvey(surveyId);
    log.info('Survey deleted successfully', 'deleteSurvey', { userId, surveyId });   
    return { message: 'Survey deleted successfully' };
  }

  // 14. Duplicate survey
  async duplicateSurvey(userId: string, surveyId: string) {
    log.info('Duplicating survey', 'duplicateSurvey', { userId, surveyId });    
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for duplication', 'duplicateSurvey', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    const slug = await generateUniqueSlug(`${survey.title} (Copy)`);
    log.debug('Generated slug for duplicate', 'duplicateSurvey', { 
      userId, 
      originalSurveyId: surveyId, 
      newSlug: slug 
    });
    const surveyData = survey.toObject();
    delete surveyData._id; // remove the original _id
    const cleanData = {
      ...surveyData,
      title: `${survey.title} (Copy)`,
      slug,
      status: 'draft',
      createdBy: userId,
      locked: false,
      startDate: undefined,
      endDate: undefined,
      closeDate: undefined,
      textColor: survey.textColor,
      backgroundColor: survey.backgroundColor,
    };
    const duplicated = await this.repo.createSurvey(cleanData);

    try {
      const originalSurveyRespondents = await this.surveyRespondentsService.getBySurveyIdIdsOnly(surveyId);
      
      if (originalSurveyRespondents) {
        const newSurveyId = String(duplicated._id);
        log.info('Duplicating respondents and groups', 'duplicateSurvey', { 
          originalSurveyId: surveyId, 
          newSurveyId,
          respondentCount: originalSurveyRespondents.allowedRespondents?.length || 0,
          groupCount: originalSurveyRespondents.allowedGroups?.length || 0
        });
        const respondentIds = (originalSurveyRespondents.allowedRespondents || []).map((id: any) => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object' && id._id) return String(id._id);
          return String(id);
        });
        const groupIds = (originalSurveyRespondents.allowedGroups || []).map((id: any) => {
          if (typeof id === 'string') return id;
          if (id && typeof id === 'object' && id._id) return String(id._id);
          return String(id);
        });
        
        await this.surveyRespondentsService.mergeRecipients(
          newSurveyId,
          respondentIds,
          groupIds
        );
        
        log.info('Respondents and groups duplicated successfully', 'duplicateSurvey', { 
          userId, 
          originalSurveyId: surveyId, 
          newSurveyId
        });
      } else {
        log.info('No respondents or groups to duplicate', 'duplicateSurvey', { 
          userId, 
          originalSurveyId: surveyId, 
          newSurveyId: String(duplicated._id)
        });
      }
    } catch (error: any) {
      log.error('Failed to duplicate respondents and groups', 'duplicateSurvey', { 
        userId, 
        originalSurveyId: surveyId, 
        newSurveyId: String(duplicated._id),
        error: error.message 
      });
    }
    
    log.info('Survey duplicated successfully', 'duplicateSurvey', { 
      userId, 
      originalSurveyId: surveyId, 
      newSurveyId: duplicated._id 
    });
    return duplicated;
  }

  // 15. Export survey
  async exportSurvey(userId: string, surveyId: string) {
    log.info('Exporting survey', 'exportSurvey', { userId, surveyId });   
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for export', 'exportSurvey', { userId, surveyId });
      throw new Error('Survey not found');
    }
    log.info('Survey exported successfully', 'exportSurvey', { 
      userId, 
      surveyId, 
      title: survey.title 
    });
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      survey: {
        title: survey.title,
        description: survey.description,
        theme: survey.theme,
        pages: survey.pages,
      },
    };
  }

  // 16. Import survey
  async importSurvey(userId: string, surveyData: any) {
    log.info('Importing survey', 'importSurvey', { userId });   
    const survey = surveyData?.survey || surveyData;
    if (!survey?.title) {
      log.warn('Invalid survey data format for import', 'importSurvey', { 
        userId,
        hasSurvey: !!survey,
        surveyKeys: survey ? Object.keys(survey) : []
      });
      throw new Error('Invalid survey data format: Missing title');
    }
    if (
      !survey.title ||
      typeof survey.title !== 'string' ||
      survey.title.trim() === ''
    ) {
      log.warn('Imported survey validation failed: Invalid title', 'importSurvey', { userId });
      throw new Error('Validation: Imported survey must have a valid title');
    }
    // Validate pages if present
    if (survey.pages) {
      if (!Array.isArray(survey.pages)) {
        log.warn('Imported survey validation failed: Pages must be array', 'importSurvey', { 
          userId 
        });
        throw new Error('Validation: Pages must be an array');
      }
      for (let i = 0; i < survey.pages.length; i++) {
        validatePage(survey.pages[i], i);
      }
    }
    // Generate a unique slug for the imported survey
    const slug = await generateUniqueSlug(`${survey.title} (Imported)`);
    log.debug('Generated slug for imported survey', 'importSurvey', { 
      userId, 
      slug 
    });
    // Create the survey with imported data
    const importedSurvey = await this.repo.createSurvey({
      title: `${survey.title} (Imported)`,
      description: survey.description,
      theme: survey.theme,
      pages: survey.pages || [],
      slug,
      status: 'draft',
      createdBy: userId,
      locked: false,
    });
    log.info('Survey imported successfully', 'importSurvey', { 
      userId, 
      newSurveyId: importedSurvey._id, 
      title: importedSurvey.title 
    });
    return importedSurvey;
  }
  // 17. Static method to delete survey (used in user deletion)
  static async deleteSurvey(surveyId: string, userId: string): Promise<void> {
    log.info('Static deleteSurvey called', 'deleteSurvey', { surveyId, userId });
    const repo = new SurveyRepository();
    const survey = await repo.findById(surveyId);

    if (!survey) {
      log.warn('Survey not found in static delete', 'deleteSurvey', { 
        surveyId, 
        userId 
      });
      throw new Error('Survey not found');
    }
    if ((survey as any).createdBy?.toString() !== userId) {
      log.error('Unauthorized delete attempt', 'deleteSurvey', { 
        surveyId, 
        userId, 
        actualCreator: (survey as any).createdBy 
      });
      throw new Error('Unauthorized to delete this survey');
    }
    await repo.deleteSurvey(surveyId);
    log.info('Survey deleted via static method', 'deleteSurvey', { 
      surveyId, 
      userId 
    });
  }
}
