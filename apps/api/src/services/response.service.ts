import { ResponseRepository } from '../repository/response.repository';
import { SurveyRepository } from '../repository/survey.repository';

export class ResponseService {
  private readonly repo = new ResponseRepository();
  private readonly surveyRepo = new SurveyRepository();

  async getOverviewForCreator(userId: string) {
    // Derive the list of survey IDs created by this user
    const surveysIdOnly = await (await import('../models/Survey')).Survey.find({ createdBy: userId }).distinct('_id');
    const surveyIds = surveysIdOnly as any;

    if (!surveyIds || (Array.isArray(surveyIds) && surveyIds.length === 0)) {
      return { responses: [], totalResponses: 0, completedResponses: 0, recentResponses: [] };
    }

    const responses = await this.repo.findRecentBySurveys(surveyIds, 50);
    const totalResponses = await (await import('../models/Response')).Response.countDocuments({ survey: { $in: surveyIds } });
    const completedResponses = await (await import('../models/Response')).Response.countDocuments({ survey: { $in: surveyIds }, status: 'Completed' });

    return {
      responses,
      totalResponses,
      completedResponses,
      recentResponses: responses.slice(0, 10),
    };
  }

  async autoSave(surveyId: string, email: string, body: any) {
    const { responses, metadata, status, updatedAt } = body;
    if (!responses || !metadata || !status || !updatedAt) throw new Error('Missing required fields');
    if (status !== 'InProgress') throw new Error('Invalid status for auto-save');
    await this.repo.upsertAutoSave(surveyId, email, { responses, metadata, status, updatedAt });
    return { message: 'Progress auto-saved' };
  }

  async submit(surveyId: string, email: string, body: any) {
    const { responses, metadata } = body;
    if (!responses || !metadata) throw new Error('Missing required fields');

    const survey = await this.surveyRepo.findById(surveyId);
    if (!survey) throw new Error('Survey not found');
    if (survey.status !== 'published') throw new Error('Survey is not published');
    if (survey.closeDate && new Date(survey.closeDate) < new Date()) throw new Error('Survey has closed');

    const existingResponse = await (await import('../models/Response')).Response.findOne({ survey: surveyId, respondentEmail: email });
    if (existingResponse?.status === 'Completed') throw new Error('Survey already submitted');

    const responseDoc = await this.repo.submitFinal(surveyId, email, { responses, metadata });
    return responseDoc;
  }
}


