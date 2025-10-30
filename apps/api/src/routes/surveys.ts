import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { SurveyService } from '../services/survey.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ensureSurveyEditable } from '../middleware/ensureSurveyEditable';
import log from '../logger';  

const router = express.Router();
const service = new SurveyService();
const defaultSurveyLimit = 10;
const maxSurveyLimit = 100;
const defaultRespondentProgressLimit = 20;
const maxRespondentProgressLimit = 200;

// GET /api/surveys - Get all surveys for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      Number.parseInt(req.query.limit as string) || defaultSurveyLimit,
      maxSurveyLimit
    );
    
    // Extract all filter parameters
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom as string;
    }
    
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo as string;
    }
    
    if (req.query.dateField) {
      filters.dateField = req.query.dateField as string;
    }
    
    log.info('Fetching surveys', 'GET_SURVEYS', {
      userId: req.user._id.toString(),
      page,
      limit,
      filters
    });

    const { surveysWithResponses, totalSurveys } = await service.getAllSurveys(
      req.user._id.toString(), 
      page, 
      limit,
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    const mapped = surveysWithResponses.map((survey: any) => ({
      id: survey._id.toString(),
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      status: survey.status,
      closeDate: survey.closeDate,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      responseCount: survey.responseCount,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
      locked: survey.locked
    }));

    res.json({
      surveys: mapped,
      pagination: {
        page,
        limit,
        total: totalSurveys,
        totalPages: Math.ceil(totalSurveys / limit),
        hasNext: page * limit < totalSurveys,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    log.error('Failed to fetch surveys', 'GET_SURVEYS', {
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});


// POST /api/surveys - Create new survey
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    log.info('Creating survey', 'CREATE_SURVEY', { 
      userId: req.user._id.toString(),
      title: req.body.title 
    });

    const survey = await service.createSurvey(req.user._id.toString(), req.body);
    
    log.info('Survey created successfully', 'CREATE_SURVEY', { 
      surveyId: String(survey._id),
      slug: survey.slug,
      userId: req.user._id.toString()
    });

    res.status(201).json({
      id: survey._id,
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      status: survey.status,
      closeDate: survey.closeDate,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      pages: survey.pages,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor
    });
  } catch (error) {
    log.error('Failed to create survey', 'CREATE_SURVEY', { 
      userId: req.user?._id.toString(),
      title: req.body.title,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// GET /api/surveys/:surveyId - Get survey by ID (for creators)
router.get('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Fetching survey by ID', 'GET_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const survey = await service.getSurveyById(req.user._id.toString(), surveyId);

    res.json({
      id: survey._id,
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      status: survey.status,
      startDate: survey.startDate,
      endDate: survey.endDate,
      closeDate: survey.closeDate,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      pages: survey.pages,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
    });
  } catch (error) {
    log.error('Failed to fetch survey', 'GET_SURVEY', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/by-slug/:slug - Get survey by slug (for preview and internal use)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    log.info('Fetching survey by slug', 'GET_SURVEY_BY_SLUG', { slug });

    const survey = await service.getSurveyBySlug(slug);

    res.json({
      id: survey._id,
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
      pages: survey.pages,
      status: survey.status
    });
  } catch (error) {
    log.error('Failed to fetch survey by slug', 'GET_SURVEY_BY_SLUG', { 
      slug: req.params.slug,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/by-id/:id - Get survey by ID (for preview and internal use)
router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    log.info('Fetching survey by object ID', 'GET_SURVEY_BY_ID', { surveyId: id });

    const survey = await service.getSurveyByObjectId(id);

    res.json({
      id: survey._id,
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
      pages: survey.pages,
      status: survey.status
    });
  } catch (error) {
    log.error('Failed to fetch survey by ID', 'GET_SURVEY_BY_ID', { 
      surveyId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/public/:slug - Get survey by slug (for respondents)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    log.info('Public survey access', 'GET_PUBLIC_SURVEY', { slug });
    const survey = await service.getPublicSurvey(slug);
    res.json({
      id: survey._id,
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
      pages: survey.pages,
      status: survey.status
    });
  } catch (error) {
    log.error('Failed to fetch public survey', 'GET_PUBLIC_SURVEY', { 
      slug: req.params.slug,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/:surveyId/respondents
router.get('/:surveyId/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Fetching respondents', 'GET_RESPONDENTS', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const surveyRespondents = await service.getRespondents(req.user._id.toString(), surveyId);
    res.json(surveyRespondents);
  } catch (error) {
    log.error('Failed to fetch respondents', 'GET_RESPONDENTS', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch respondents' });
  }
});

// POST /api/surveys/:surveyId/respondents - Add respondent (without sending email)
router.post('/:surveyId/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const { email } = req.body;
    
    log.info('Adding respondent', 'ADD_RESPONDENT', { 
      surveyId,
      email,
      userId: req.user._id.toString()
    });

    const result = await service.addRespondent(req.user._id.toString(), surveyId, email);
    res.json(result);
  } catch (error) {
    log.error('Failed to add respondent', 'ADD_RESPONDENT', { 
      surveyId: req.params.surveyId,
      email: req.body.email,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to add respondent' });
  }
});

// DELETE /api/surveys/:surveyId/respondents/:email - Remove respondent
router.delete('/:surveyId/respondents/:email', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId, email } = req.params;
    
    log.info('Removing respondent', 'REMOVE_RESPONDENT', { 
      surveyId,
      email,
      userId: req.user._id.toString()
    });

    const result = await service.removeRespondent(req.user._id.toString(), surveyId, email);
    res.json(result);
  } catch (error) {
    log.error('Failed to remove respondent', 'REMOVE_RESPONDENT', { 
      surveyId: req.params.surveyId,
      email: req.params.email,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to remove respondent' });
  }
});

// POST /api/surveys/:surveyId/respondents/send-invitations - Send emails to all respondents
router.post('/:surveyId/respondents/send-invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Sending survey invitations', 'SEND_INVITATIONS', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const results = await service.sendInvitations(req.user._id.toString(), surveyId);
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.length - successful;
    
    log.info('Invitations sent', 'SEND_INVITATIONS', { 
      surveyId,
      successful,
      failed,
      total: results.length
    });

    res.json({ 
      message: 'Invitations sent successfully to ' + successful + ' respondents' + (failed > 0 ? ', ' + failed + ' failed' : ''),
      results
    });
  } catch (error) {
    log.error('Failed to send invitations', 'SEND_INVITATIONS', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// GET /api/surveys/:surveyId/respondent-progress
router.get('/:surveyId/respondent-progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      Number.parseInt(req.query.limit as string) || defaultRespondentProgressLimit,
      maxRespondentProgressLimit
    );

    log.info('Fetching respondent progress', 'GET_RESPONDENT_PROGRESS', { 
      surveyId,
      page,
      limit,
      userId: req.user._id.toString()
    });

    const result = await service.getRespondentProgress(req.user._id.toString(), surveyId, page, limit);
    res.json(result);
  } catch (error) {
    log.error('Failed to fetch respondent progress', 'GET_RESPONDENT_PROGRESS', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch respondent progress' });
  }
});

// PUT /api/surveys/:surveyId - Update survey
router.put('/:surveyId', requireAuth, ensureSurveyEditable, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Updating survey', 'UPDATE_SURVEY', { 
      surveyId,
      userId: req.user._id.toString(),
      updateFields: Object.keys(req.body)
    });

    const survey = await service.updateSurvey(req.user._id.toString(), surveyId, req.body);
    
    log.info('Survey updated successfully', 'UPDATE_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    res.json({ 
      message: 'Survey updated successfully',
      survey: {
        id: survey._id,
        title: survey.title,
        description: survey.description,
        slug: survey.slug,
        status: survey.status,
        closeDate: survey.closeDate,
        startDate: survey.startDate,
        endDate: survey.endDate,
        theme: survey.theme,
        backgroundColor: survey.backgroundColor,
        textColor: survey.textColor,
        pages: survey.pages,
        locked: survey.locked
      }
    });
  } catch (error) {
    log.error('Failed to update survey', 'UPDATE_SURVEY', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// DELETE /api/surveys/:surveyId - Delete survey
router.delete('/:surveyId', requireAuth, ensureSurveyEditable, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    log.info('Deleting survey', 'DELETE_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const result = await service.deleteSurvey(req.user._id.toString(), surveyId);
    
    log.info('Survey deleted successfully', 'DELETE_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    res.json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && 'kind' in error) {
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        log.warn('Invalid survey ID format', 'DELETE_SURVEY', { 
          surveyId: req.params.surveyId 
        });
        return res.status(400).json({ error: 'Invalid survey ID format' });
      }
    }
    log.error('Failed to delete survey', 'DELETE_SURVEY', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// POST /api/surveys/:surveyId/duplicate - Duplicate survey
router.post('/:surveyId/duplicate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Duplicating survey', 'DUPLICATE_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const duplicatedSurvey = await service.duplicateSurvey(req.user._id.toString(), surveyId);
    
    log.info('Survey duplicated successfully', 'DUPLICATE_SURVEY', { 
      originalSurveyId: surveyId,
      newSurveyId: String(duplicatedSurvey._id),
      userId: req.user._id.toString()
    });

    res.status(201).json({
      id: duplicatedSurvey._id,
      title: duplicatedSurvey.title,
      description: duplicatedSurvey.description,
      slug: duplicatedSurvey.slug,
      status: duplicatedSurvey.status,
      closeDate: duplicatedSurvey.closeDate,
      createdAt: duplicatedSurvey.createdAt,
      updatedAt: duplicatedSurvey.updatedAt,
      pages: duplicatedSurvey.pages,
      theme: duplicatedSurvey.theme,
      backgroundColor: duplicatedSurvey.backgroundColor,
      textColor: duplicatedSurvey.textColor
    });
  } catch (error) {
    log.error('Failed to duplicate survey', 'DUPLICATE_SURVEY', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to duplicate survey' });
  }
});

// POST /api/surveys/:surveyId/export - Export survey as JSON
router.post('/:surveyId/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    log.info('Exporting survey', 'EXPORT_SURVEY', { 
      surveyId,
      userId: req.user._id.toString()
    });

    const exportData = await service.exportSurvey(req.user._id.toString(), surveyId);
    res.setHeader('Content-Type', 'application/json');
    const safeTitle = (exportData.survey.title || 'survey').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-${Date.now()}.json"`);
    
    log.info('Survey exported successfully', 'EXPORT_SURVEY', { 
      surveyId,
      fileName: `${safeTitle}-${Date.now()}.json`,
      userId: req.user._id.toString()
    });

    res.json(exportData);
  } catch (error) {
    log.error('Failed to export survey', 'EXPORT_SURVEY', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to export survey' });
  }
});

// POST /api/surveys/import - Import survey from JSON
router.post('/import', requireAuth, async (req: AuthRequest, res) => {
  try {
    log.info('Importing survey', 'IMPORT_SURVEY', { 
      userId: req.user._id.toString(),
      surveyTitle: req.body.surveyData?.survey?.title
    });

    const { surveyData } = req.body;
    const importedSurvey = await service.importSurvey(req.user._id.toString(), surveyData);
    
    log.info('Survey imported successfully', 'IMPORT_SURVEY', { 
      surveyId: String(importedSurvey._id),
      title: importedSurvey.title,
      userId: req.user._id.toString()
    });

    res.status(201).json({
      id: importedSurvey._id,
      title: importedSurvey.title,
      description: importedSurvey.description,
      slug: importedSurvey.slug,
      status: importedSurvey.status,
      closeDate: importedSurvey.closeDate,
      createdAt: importedSurvey.createdAt,
      updatedAt: importedSurvey.updatedAt,
      pages: importedSurvey.pages,
      theme: importedSurvey.theme,
      backgroundColor: importedSurvey.backgroundColor,
      textColor: importedSurvey.textColor
    });
  } catch (error) {
    log.error('Failed to import survey', 'IMPORT_SURVEY', { 
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to import survey' });
  }
});

export default router;