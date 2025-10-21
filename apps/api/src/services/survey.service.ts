import dotenv from 'dotenv';
dotenv.config();
import { SurveyRepository } from '../repository/survey.repository';
import { ResponseRepository } from '../repository/response.repository';
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
  // 1. Get all surveys for authenticated user
  async getAllSurveys(userId: string, page = 1, limit = 10) {
    log.info('Fetching all surveys for user', 'getAllSurveys', { userId, page, limit });
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (page - 1) * safeLimit;
    const surveysWithResponses: any[] = await this.repo.findAllByCreator(
      userId,
      skip,
      safeLimit
    );
    const totalSurveys = await this.repo.countByCreator(userId);
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
      allowedRespondents: [],
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
    if (survey.closeDate && new Date() > new Date(survey.closeDate)) {
      log.warn('Survey is closed', 'getPublicSurvey', { 
        slug, 
        closeDate: survey.closeDate 
      });
      throw new Error('This survey is closed');
    }
    return survey;
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
    log.debug('Respondents retrieved', 'getRespondents', { 
      userId, 
      surveyId, 
      count: (survey.allowedRespondents || []).length 
    });
    return survey.allowedRespondents || [];
  }

  // 8. Add respondent (auto-send email if survey is live)
  async addRespondent(userId: string, surveyId: string, email: string) {
    log.info('Adding respondent', 'addRespondent', { userId, surveyId, email });
    if (!email) {
      log.warn('Email is required for adding respondent', 'addRespondent', { 
        userId, 
        surveyId 
      });
      throw new Error('Email is required');
    }
    if (!validator.isEmail(email)) {
      log.warn('Invalid email format', 'addRespondent', { userId, surveyId, email });
      throw new Error('Invalid email format');
    }
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for adding respondent', 'addRespondent', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    if (!survey.allowedRespondents) survey.allowedRespondents = [];
    if (survey.allowedRespondents.includes(email)) {
      log.warn('Email already added to survey', 'addRespondent', { 
        userId, 
        surveyId, 
        email 
      });
      throw new Error('Email already added');
    }
    survey.allowedRespondents.push(email);
    await this.repo.updateSurvey(surveyId, {
      allowedRespondents: survey.allowedRespondents,
    });
    log.info('Respondent added successfully', 'addRespondent', { 
      userId, 
      surveyId, 
      email, 
      surveyStatus: survey.status 
    });

    // AUTO-SEND EMAIL IF SURVEY IS LIVE
    if (survey.status === 'live') {
      log.info('Auto-sending invitation (survey is live)', 'addRespondent', { 
        userId, 
        surveyId, 
        email 
      });
      try {
        await this.sendInvitations(userId, surveyId);
        log.info('Auto-sent invitation successfully', 'addRespondent', { 
          userId, 
          surveyId, 
          email 
        });
        return {
          message: 'Respondent added and invitation sent successfully',
          emailSent: true,
        };
      } catch (emailError) {
        log.error('Failed to auto-send email invitation', 'addRespondent', {
          userId,
          surveyId,
          email,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
        return {
          message: 'Respondent added but email failed to send',
          emailSent: false,
          error:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
        };
      }
    }
    return {
      message: 'Respondent added successfully',
      emailSent: false,
    };
  }

  // 9. Remove respondent
  async removeRespondent(userId: string, surveyId: string, email: string) {
    log.info('Removing respondent', 'removeRespondent', { userId, surveyId, email });
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) {
      log.warn('Survey not found for removing respondent', 'removeRespondent', { 
        userId, 
        surveyId 
      });
      throw new Error('Survey not found');
    }
    survey.allowedRespondents = (survey.allowedRespondents || []).filter(
      (e) => e !== email
    );
    await this.repo.updateSurvey(surveyId, {
      allowedRespondents: survey.allowedRespondents,
    });
    log.info('Respondent removed successfully', 'removeRespondent', { 
      userId, 
      surveyId, 
      email, 
      remainingCount: survey.allowedRespondents.length 
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
    if (!survey.allowedRespondents || survey.allowedRespondents.length === 0) {
      log.warn('No respondents to send invitations to', 'sendInvitations', { 
        userId, 
        surveyId 
      });
      throw new Error('No respondents to send invitations to');
    }

    const alreadySent = survey.invitationsSent || [];
    const newRespondents = survey.allowedRespondents.filter(
      (email) => !alreadySent.includes(email)
    );

    log.info('Preparing to send invitations', 'sendInvitations', { 
      userId, 
      surveyId, 
      totalRespondents: survey.allowedRespondents.length, 
      alreadySent: alreadySent.length, 
      newRespondents: newRespondents.length 
    });
    const results = await Promise.allSettled(
      newRespondents.map(async (email) => {
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

    // Update database with successful sends
    const successfulEmails = results
      .filter((r) => r.status === 'fulfilled' && r.value.success)
      .map((r) => (r as PromiseFulfilledResult<any>).value.email);
    if (successfulEmails.length > 0) {
      await this.repo.updateSurvey(surveyId, {
        $addToSet: { invitationsSent: { $each: successfulEmails } },
      });
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
    const allRespondents = (survey.allowedRespondents || []).map((email) => {
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

  // Extract method: Handle live transition with validations and email sending
  private async handleLiveTransition(survey: any, userId: string, surveyId: string): Promise<void> {
    log.info('Survey status changed to live - initiating automated invitations', 'updateSurvey', {
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
    await this.sendAutomatedInvitations(userId, surveyId, survey);
  }

  // Extract method: Validate survey can go live
  private validateSurveyCanGoLive(survey: any, userId: string, surveyId: string): void {
    if (!survey.allowedRespondents || survey.allowedRespondents.length === 0) {
      log.error('Cannot go live: No respondents added', 'updateSurvey', { 
        userId, 
        surveyId 
      });
      throw new Error('Cannot go live: No respondents added to survey');
    }
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
  }

  // Extract method: Send automated invitations
  private async sendAutomatedInvitations(userId: string, surveyId: string, survey: any): Promise<void> {
    try {
      const results = await this.sendInvitations(userId, surveyId);
      const successCount = results.filter((r: any) => r.success).length;
      log.info('Automated invitations completed', 'updateSurvey', {
        userId,
        surveyId,
        successCount,
        totalRespondents: survey.allowedRespondents.length
      });
    } catch (emailError) {
      log.error('Error sending automated invitations', 'updateSurvey', {
        userId,
        surveyId,
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
    }
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
    const duplicated = await this.repo.createSurvey({
      ...surveyData,
      title: `${survey.title} (Copy)`,
      slug,
      status: 'draft',
      allowedRespondents: [],
      createdBy: userId,
      locked: false,
    });
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
    // Validate the import data structure
    if (!surveyData?.surveyData.survey) {
      log.warn('Invalid survey data format for import', 'importSurvey', { userId });
      throw new Error('Invalid survey data format');
    }
    const { survey } = surveyData;
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
      allowedRespondents: [],
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
