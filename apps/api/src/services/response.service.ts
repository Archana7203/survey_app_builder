import { ResponseRepository } from '../repository/response.repository';
import { SurveyRepository } from '../repository/survey.repository';
import log from '../logger';
import crypto from 'crypto';

export class ResponseService {
  private readonly repo = new ResponseRepository();
  private readonly surveyRepo = new SurveyRepository();

  async getOverviewForCreator(userId: string) {
    log.info('Fetching response overview for creator', 'getOverviewForCreator', { userId });
    const surveysIdOnly = await (await import('../models/Survey')).Survey.find({ createdBy: userId }).distinct('_id');
    const surveyIds = surveysIdOnly as any;
    if (!surveyIds || (Array.isArray(surveyIds) && surveyIds.length === 0)) {
      log.info('No surveys found for user', 'getOverviewForCreator', { userId });
      return { responses: [], totalResponses: 0, completedResponses: 0, recentResponses: [] };
    }
    log.debug('Calculating response statistics', 'getOverviewForCreator', { 
      userId, 
      surveyCount: surveyIds.length 
    });
    const responses = await this.repo.findRecentBySurveys(surveyIds, 50);
    const totalResponses = await (await import('../models/Response')).Response.countDocuments({ survey: { $in: surveyIds } });
    const completedResponses = await (await import('../models/Response')).Response.countDocuments({ survey: { $in: surveyIds }, status: 'Completed' });
    log.info('Response overview retrieved', 'getOverviewForCreator', { 
      userId, 
      totalResponses, 
      completedResponses, 
      recentCount: responses.length 
    });
    return {
      responses,
      totalResponses,
      completedResponses,
      recentResponses: responses.slice(0, 10),
    };
  }

  async autoSave(surveyId: string, email: string, body: any) {
    const emailHash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 12);
    log.info('Auto-saving response progress', 'autoSave', { surveyId, emailHash, status: body.status });
    const { responses, metadata, status, updatedAt } = body;
    if (!responses || !metadata || !status || !updatedAt) {
      log.warn('Auto-save validation failed: Missing required fields', 'autoSave', { surveyId, emailHash });
      throw new Error('Missing required fields');
    }
    if (status !== 'InProgress') {
      log.warn('Auto-save validation failed: Invalid status', 'autoSave', { surveyId, emailHash, status });
      throw new Error('Invalid status for auto-save');
    }
    // Prevent any auto-save writes after final submission
    const existing = await (await import('../models/Response')).Response.findOne({ survey: surveyId, respondentEmail: email }).select('status');
    if (existing?.status === 'Completed') {
      log.warn('Auto-save blocked: response already completed', 'autoSave', { surveyId, emailHash });
      throw new Error('Survey already submitted');
    }
    await this.repo.upsertAutoSave(surveyId, email, { responses, metadata, status, updatedAt });
    log.info('Response progress auto-saved successfully', 'autoSave', { 
      surveyId, 
      emailHash, 
      lastPageIndex: metadata.lastPageIndex 
    });
    return { message: 'Progress auto-saved' };
  }

  async submit(surveyId: string, email: string, body: any) {
    const emailHash = crypto.createHash('sha256').update(email).digest('hex').substring(0, 12);
    log.info('Submitting survey response', 'submit', { surveyId, emailHash });
    const { responses, metadata } = body;   
    if (!responses || !metadata) {
      log.warn('Submit validation failed: Missing required fields', 'submit', { surveyId, emailHash });
      throw new Error('Missing required fields');
    }
    const survey = await this.surveyRepo.findById(surveyId);   
    if (!survey) {
      log.warn('Survey not found for submission', 'submit', { surveyId, emailHash });
      throw new Error('Survey not found');
    }    
    if (survey.status !== 'published' && survey.status !== 'live') {
      log.warn('Survey not available for responses', 'submit', { 
        surveyId, 
        emailHash, 
        surveyStatus: survey.status 
      });
      throw new Error('Survey is not available for responses');
    }    
    // Enforce endDate as source of truth for closure
    if (survey.endDate && new Date(survey.endDate) <= new Date()) {
      log.warn('Survey has closed (endDate reached)', 'submit', { surveyId, emailHash, endDate: survey.endDate });
      throw new Error('Survey has closed');
    }
    const existingResponse = await (await import('../models/Response')).Response.findOne({ survey: surveyId, respondentEmail: email });
    if (existingResponse?.status === 'Completed') {
      log.warn('Survey already submitted', 'submit', { 
        surveyId, 
        emailHash, 
        existingResponseId: existingResponse._id 
      });
      throw new Error('Survey already submitted');
    }
    const responseDoc = await this.repo.submitFinal(surveyId, email, { responses, metadata });
    log.info('Survey response submitted successfully', 'submit', { 
      surveyId, 
      emailHash, 
      responseId: responseDoc._id 
    });
    return responseDoc;
  }

  async getBySurveyAndEmail(creatorUserId: string, surveyId: string, email: string) {
    const survey = await this.surveyRepo.findByIdAndCreator(surveyId, creatorUserId);
    if (!survey) {
      throw new Error('Survey not found or no permission');
    }
    const responseDoc = await this.repo.findOneBySurveyAndEmail(surveyId, email);
    if (!responseDoc) {
      return null;
    }
    return responseDoc;
  }
}


