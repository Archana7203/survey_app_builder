import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import { SurveyService } from '../services/survey.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ensureSurveyEditable } from '../middleware/ensureSurveyEditable';

const router = express.Router();

// Default pagination limits
const defaultSurveyLimit = 10;
const maxSurveyLimit = 100;
const defaultRespondentProgressLimit = 20;
const maxRespondentProgressLimit = 200;

// GET /api/surveys - Get all surveys for the authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Parse pagination parameters
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      Number.parseInt(req.query.limit as string) || defaultSurveyLimit,
      maxSurveyLimit // Maximum limit
    );

    const service = new SurveyService();
    const { surveysWithResponses, totalSurveys } = await service.getAllSurveys(req.user._id.toString(), page, limit);
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
      allowedRespondents: survey.allowedRespondents || [],
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
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// POST /api/surveys - Create new survey
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const service = new SurveyService();
    const survey = await service.createSurvey(req.user._id.toString(), req.body);
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
      textColor: survey.textColor,
      allowedRespondents: survey.allowedRespondents
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// GET /api/surveys/:surveyId - Get survey by ID (for creators)
router.get('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const survey = await service.getSurveyById(req.user._id.toString(), surveyId);

    res.json({
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
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/by-slug/:slug - Get survey by slug (for preview and internal use)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('By-slug route accessed with slug:', slug);
    const service = new SurveyService();
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
    console.error('Error fetching survey by slug:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/by-id/:id - Get survey by ID (for preview and internal use)
router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('By-id route accessed with id:', id);
    const service = new SurveyService();
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
    console.error('Error fetching survey by id:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/public/:slug - Get survey by slug (for respondents)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Public route accessed with slug:', slug);
    const service = new SurveyService();
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
    console.error('Error fetching survey by slug:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// GET /api/surveys/:surveyId/respondents
router.get('/:surveyId/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const allowedRespondents = await service.getRespondents(req.user._id.toString(), surveyId);
    res.json({ allowedRespondents });
  } catch (error) {
    console.error('Error fetching respondents:', error);
    res.status(500).json({ error: 'Failed to fetch respondents' });
  }
});

// POST /api/surveys/:surveyId/respondents - Add respondent (without sending email)
router.post('/:surveyId/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const { email } = req.body;
    const service = new SurveyService();
    const result = await service.addRespondent(req.user._id.toString(), surveyId, email);
    res.json(result);
  } catch (error) {
    console.error('Error adding respondent:', error);
    res.status(500).json({ error: 'Failed to add respondent' });
  }
});

// DELETE /api/surveys/:surveyId/respondents/:email - Remove respondent
router.delete('/:surveyId/respondents/:email', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId, email } = req.params;
    const service = new SurveyService();
    const result = await service.removeRespondent(req.user._id.toString(), surveyId, email);
    res.json(result);
  } catch (error) {
    console.error('Error removing respondent:', error);
    res.status(500).json({ error: 'Failed to remove respondent' });
  }
});

// POST /api/surveys/:surveyId/respondents/send-invitations - Send emails to all respondents
router.post('/:surveyId/respondents/send-invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const results = await service.sendInvitations(req.user._id.toString(), surveyId);
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.length - successful;
    res.json({ 
      message: 'Invitations sent successfully to ' + successful + ' respondents' + (failed > 0 ? ', ' + failed + ' failed' : ''),
      results
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// GET /api/surveys/:surveyId/respondent-progress
router.get('/:surveyId/respondent-progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    
    // Parse pagination parameters
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      Number.parseInt(req.query.limit as string) || defaultRespondentProgressLimit,
      maxRespondentProgressLimit // Maximum limit
    );

    const service = new SurveyService();
    const result = await service.getRespondentProgress(req.user._id.toString(), surveyId, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error fetching respondent progress:', error);
    res.status(500).json({ error: 'Failed to fetch respondent progress' });
  }
});

// PUT /api/surveys/:surveyId - Update survey
router.put('/:surveyId', requireAuth, ensureSurveyEditable, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const updateData = req.body;
    const service = new SurveyService();
    const survey = await service.updateSurvey(req.user._id.toString(), surveyId, updateData);
    res.json({ 
      message: 'Survey updated successfully',
      survey: {
        id: survey._id,
        title: survey.title,
        description: survey.description,
        slug: survey.slug,
        status: survey.status,
        closeDate: survey.closeDate,
        theme: survey.theme,
        backgroundColor: survey.backgroundColor,
        textColor: survey.textColor,
        pages: survey.pages,
        allowedRespondents: survey.allowedRespondents,
        locked: survey.locked
      }
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// DELETE /api/surveys/:surveyId - Delete survey
router.delete('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const result = await service.deleteSurvey(req.user._id.toString(), surveyId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// POST /api/surveys/:surveyId/duplicate - Duplicate survey
router.post('/:surveyId/duplicate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const duplicatedSurvey = await service.duplicateSurvey(req.user._id.toString(), surveyId);
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
      textColor: duplicatedSurvey.textColor,
      allowedRespondents: duplicatedSurvey.allowedRespondents
    });
  } catch (error) {
    console.error('Error duplicating survey:', error);
    res.status(500).json({ error: 'Failed to duplicate survey' });
  }
});

// POST /api/surveys/:surveyId/export - Export survey as JSON
router.post('/:surveyId/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const service = new SurveyService();
    const exportData = await service.exportSurvey(req.user._id.toString(), surveyId);
    res.setHeader('Content-Type', 'application/json');
    // Use safe title if possible
    const safeTitle = (exportData.survey.title || 'survey').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting survey:', error);
    res.status(500).json({ error: 'Failed to export survey' });
  }
});

export default router;