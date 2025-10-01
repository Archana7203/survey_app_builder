import { SurveyRepository } from '../repository/survey.repository';
import { ResponseRepository } from '../repository/response.repository';
import { generateUniqueSlug } from '../utils/slug';
import { generateSurveyToken, sendSurveyInvite } from '../utils/email';
import mongoose from 'mongoose';
import validator from 'validator';

//Helper
const validatePage = (page: any, index: number) => {
  if (!page || typeof page !== "object") {
    throw new Error(`Validation: Invalid page data at index ${index}`);
  }
  if (!Array.isArray(page.questions)) {
    throw new Error(`Validation: Questions must be an array at page ${index + 1}`);
  }
  if (!Array.isArray(page.branching)) {
    throw new Error(`Validation: Branching must be an array at page ${index + 1}`);
  }
};

function validateSurveyUpdate(updateData: any): void {
  if (updateData.title !== undefined) {
    if (!updateData.title || typeof updateData.title !== 'string' || updateData.title.trim() === '') {
      throw new Error('Validation: Title cannot be empty');
    }
  }

  if (updateData.pages !== undefined) {
    if (!Array.isArray(updateData.pages)) throw new Error('Validation: Pages must be an array');

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
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (page - 1) * safeLimit;
    const surveysWithResponses: any[] = await this.repo.findAllByCreator(userId, skip, safeLimit);
    const totalSurveys = await this.repo.countByCreator(userId);
    return { surveysWithResponses, totalSurveys, page, limit: safeLimit };
  }

  // 2. Create new survey
  async createSurvey(userId: string, data: any) {
    // Validation
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      throw new Error('Validation: Title is required');
    }
    if (data.pages !== undefined) {
      if (!Array.isArray(data.pages)) throw new Error('Validation: Pages must be an array');
      for (let i = 0; i < data.pages.length; i++) {
        const page = data.pages[i];
        if (!page || typeof page !== 'object') throw new Error(`Validation: Invalid page data at index ${i}`);
        if (!Array.isArray(page.questions)) throw new Error(`Validation: Questions must be an array at page ${i + 1}`);
        if (!Array.isArray(page.branching)) throw new Error(`Validation: Branching must be an array at page ${i + 1}`);
      }
    }

    const slug = await generateUniqueSlug(data.title);
    const survey = await this.repo.createSurvey({
      ...data,
      slug,
      status: 'draft',
      allowedRespondents: [],
      createdBy: userId,
    });
    return survey;
  }

  // 3. Get survey by ID (creator)
  async getSurveyById(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found or no permission');
    return survey;
  }

  // 4. Get survey by slug (preview/internal)
  async getSurveyBySlug(slug: string) {
    const survey = await this.repo.findBySlug(slug);
    if (!survey) throw new Error('Survey not found');
    return survey;
  }

  // 5. Get survey by ID (preview/internal)
  async getSurveyByObjectId(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid survey ID format');
    const survey = await this.repo.findById(id);
    if (!survey) throw new Error('Survey not found');
    return survey;
  }

  // 6. Get public survey for respondents
  async getPublicSurvey(slug: string) {
    const survey = await this.repo.findBySlugPublished(slug);
    if (!survey) throw new Error('Survey not found or not accessible');
    if (survey.closeDate && new Date() > new Date(survey.closeDate)) throw new Error('This survey is closed');
    return survey;
  }

  // 7. Get allowed respondents
  async getRespondents(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');
    return survey.allowedRespondents || [];
  }

  // 8. Add respondent (without sending email)
  async addRespondent(userId: string, surveyId: string, email: string) {
    if (!email) throw new Error('Email is required');

    if (!validator.isEmail(email)) throw new Error('Invalid email format');

    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    if (!survey.allowedRespondents) survey.allowedRespondents = [];
    if (survey.allowedRespondents.includes(email)) throw new Error('Email already added');

    survey.allowedRespondents.push(email);
    await this.repo.updateSurvey(surveyId, { allowedRespondents: survey.allowedRespondents });
    return { message: 'Respondent added successfully' };
  }

  // 9. Remove respondent
  async removeRespondent(userId: string, surveyId: string, email: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    survey.allowedRespondents = (survey.allowedRespondents || []).filter(e => e !== email);
    await this.repo.updateSurvey(surveyId, { allowedRespondents: survey.allowedRespondents });
    return { message: 'Respondent removed successfully' };
  }

  // 10. Send invitations
  async sendInvitations(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    if (!survey.allowedRespondents || survey.allowedRespondents.length === 0) {
      throw new Error('No respondents to send invitations to');
    }

    const results = await Promise.allSettled(
      survey.allowedRespondents.map(async email => {
        try {
          const token = generateSurveyToken(surveyId, email);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const surveyLink = `${frontendUrl}/s/${survey.slug}?token=${token}`;
          await sendSurveyInvite(email, survey.title, surveyLink);
          return { email, success: true };
        } catch (err: any) {
          return { email, success: false, error: err.message || 'Unknown error' };
        }
      })
    );

    return results.map(r => (r.status === 'fulfilled' ? r.value : { success: false }));
  }

  // 11. Get respondent progress
  async getRespondentProgress(userId: string, surveyId: string, page = 1, limit = 20) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    const allResponses = await this.responseRepo.findBySurvey(surveyId);
    const responseMap = new Map(allResponses.map(r => [r.respondentEmail, r]));

    const allRespondents = (survey.allowedRespondents || []).map(email => {
      const response = responseMap.get(email);
      if (response) {
        let progress = 0;
        let completionPercentage = 0;

        if (response.status === 'Completed') {
          progress = survey.pages.length;
          completionPercentage = 100;
        } else if (response.status === 'InProgress') {
          progress = (response.metadata?.lastPageIndex || 0) + 1;
          completionPercentage = Math.round((progress / survey.pages.length) * 100);
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

    // Sort by status priority and lastUpdated
    allRespondents.sort((a, b) => {
      const statusPriority: Record<string, number> = { Completed: 3, InProgress: 2, 'Not Started': 1 };
      const aPriority = statusPriority[a.status] || 0;
      const bPriority = statusPriority[b.status] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      if (a.lastUpdated && b.lastUpdated) return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      return a.lastUpdated ? -1 : 1;
    });

    const start = (page - 1) * limit;
    return {
      survey: { id: survey._id, title: survey.title, totalPages: survey.pages.length, totalRespondents: allRespondents.length },
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
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    // Use the helper instead of inline validation
    validateSurveyUpdate(updateData);

    // Only allow certain fields
    const allowedUpdates = new Set([
      'status', 'title', 'description', 'closeDate', 
      'theme', 'backgroundColor', 'textColor', 'pages'
    ]);

    const filteredUpdates: any = {};

    for (const k of Object.keys(updateData)) {
      if (allowedUpdates.has(k)) {
        filteredUpdates[k] = updateData[k];
      }
    }

    const originalStatus = survey.status;
    Object.assign(survey, filteredUpdates);

    if (survey.status === 'published' && originalStatus !== 'published') {
      survey.locked = true;
      survey.closeDate = undefined;
    } else if (survey.status === 'draft' && originalStatus === 'published') {
      survey.closeDate = new Date();
    }

    await this.repo.updateSurvey(surveyId, survey);
    return survey;
  }
  // 13. Delete survey
  async deleteSurvey(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    const responseCount = await this.responseRepo.countBySurvey(surveyId);
    if (responseCount > 0) throw new Error(`Cannot delete survey with ${responseCount} response(s)`);

    await this.repo.deleteSurvey(surveyId);
    return { message: 'Survey deleted successfully' };
  }

  // 14. Duplicate survey
  async duplicateSurvey(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

    const slug = await generateUniqueSlug(`${survey.title} (Copy)`);
    const duplicated = await this.repo.createSurvey({
      ...survey.toObject(),
      title: `${survey.title} (Copy)`,
      slug,
      status: 'draft',
      allowedRespondents: [],
      createdBy: userId,
      locked: false,
    });

    return duplicated;
  }

  // 15. Export survey
  async exportSurvey(userId: string, surveyId: string) {
    const survey = await this.repo.findByIdAndCreator(surveyId, userId);
    if (!survey) throw new Error('Survey not found');

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
}
