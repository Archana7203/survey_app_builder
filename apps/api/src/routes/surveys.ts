import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import { Survey } from '../models/Survey';
import { Response } from '../models/Response';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ensureSurveyEditable } from '../middleware/ensureSurveyEditable';
import { generateUniqueSlug } from '../utils/slug';
import { generateSurveyToken, sendSurveyInvite } from '../utils/email';
import mongoose from 'mongoose';

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || defaultSurveyLimit,
      maxSurveyLimit // Maximum limit
    );
    const skip = (page - 1) * limit;

    // Use aggregation to get surveys with response counts in a single query
    const surveysWithResponses = await Survey.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $lookup: {
          from: 'responses',
          localField: '_id',
          foreignField: 'survey',
          as: 'responses'
        }
      },
      {
        $addFields: {
          responseCount: {
            $size: {
              $filter: {
                input: '$responses',
                cond: { $eq: ['$$this.status', 'Completed'] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          slug: 1,
          status: 1,
          closeDate: 1,
          createdAt: 1,
          updatedAt: 1,
          responseCount: 1,
          allowedRespondents: 1,
          locked: 1
        }
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalSurveys = await Survey.countDocuments({ createdBy: req.user._id });

    // Map to frontend-friendly shape
    const mapped = surveysWithResponses.map((survey) => ({
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
    const { title, description, theme, backgroundColor, textColor, pages } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate pages structure if provided
    if (pages !== undefined) {
      if (!Array.isArray(pages)) {
        return res.status(400).json({ error: 'Pages must be an array' });
      }
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page || typeof page !== 'object') {
          return res.status(400).json({ error: `Invalid page data at index ${i}` });
        }
        
        if (!Array.isArray(page.questions)) {
          return res.status(400).json({ error: `Questions must be an array at page ${i + 1}` });
        }
        
        if (!Array.isArray(page.branching)) {
          return res.status(400).json({ error: `Branching must be an array at page ${i + 1}` });
        }
      }
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title);
    console.log('Generated slug:', slug);

    // Create new survey
    const survey = new Survey({
      title,
      description: description || '',
      slug,
      theme: theme || 'default',
      backgroundColor,
      textColor,
      pages: pages || [{ questions: [], branching: [] }],
      status: 'draft',
      allowedRespondents: [],
      createdBy: req.user._id,
    });

    await survey.save();

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

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or you do not have permission to view this survey' });
    }

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
    
    const survey = await Survey.findOne({ slug });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

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
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid survey ID format' });
    }
    
    const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

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
    
    const survey = await Survey.findOne({ slug, status: 'published' });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not accessible' });
    }

    // Check if survey is closed (has close date in the past)
    if (survey.closeDate && new Date() > new Date(survey.closeDate)) {
      return res.status(400).json({ error: 'This survey is closed' });
    }

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

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({ allowedRespondents: survey.allowedRespondents || [] });
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

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Check if email is already in allowedRespondents
    if (survey.allowedRespondents?.includes(email)) {
      return res.status(400).json({ error: 'Email already added to this survey' });
    }

    // Add email to allowedRespondents (without sending email yet)
    if (!survey.allowedRespondents) {
      survey.allowedRespondents = [];
    }
    survey.allowedRespondents.push(email);
    await survey.save();

    res.json({ message: 'Respondent added successfully' });
  } catch (error) {
    console.error('Error adding respondent:', error);
    res.status(500).json({ error: 'Failed to add respondent' });
  }
});

// DELETE /api/surveys/:surveyId/respondents/:email - Remove respondent
router.delete('/:surveyId/respondents/:email', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId, email } = req.params;

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Remove email from allowedRespondents
    if (survey.allowedRespondents) {
      survey.allowedRespondents = survey.allowedRespondents.filter(e => e !== email);
      await survey.save();
    }

    res.json({ message: 'Respondent removed successfully' });
  } catch (error) {
    console.error('Error removing respondent:', error);
    res.status(500).json({ error: 'Failed to remove respondent' });
  }
});

// POST /api/surveys/:surveyId/respondents/send-invitations - Send emails to all respondents
router.post('/:surveyId/respondents/send-invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (!survey.allowedRespondents || survey.allowedRespondents.length === 0) {
      return res.status(400).json({ error: 'No respondents to send invitations to' });
    }

    // Send invitations to all respondents
    const emailPromises = survey.allowedRespondents.map(async (email) => {
      try {
        const token = generateSurveyToken(surveyId, email);
        const frontendUrl = process.env.FRONTEND_URL || 'https://located-supervision-weblogs-daddy.trycloudflare.com';
        const surveyLink = `${frontendUrl}/s/${survey.slug}?token=${token}`;
        await sendSurveyInvite(email, survey.title, surveyLink);
        return { email, success: true };
      } catch (error) {
        console.error(`Failed to send invitation to ${email}:`, error);
        return { email, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    res.json({ 
      message: `Invitations sent successfully to ${successful} respondents${failed > 0 ? `, ${failed} failed` : ''}`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || defaultRespondentProgressLimit,
      maxRespondentProgressLimit // Maximum limit
    );
    const skip = (page - 1) * limit;

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Get all responses for this survey
    const allResponses = await Response.find({ survey: surveyId })
      .select('respondentEmail status startedAt metadata responses');

    // Create a map of responses by email for quick lookup
    const responseMap = new Map();
    allResponses.forEach(response => {
      responseMap.set(response.respondentEmail, response);
    });

    // Get all allowed respondents and merge with responses
    const allowedRespondents = survey.allowedRespondents || [];
    const allRespondents = allowedRespondents.map(email => {
      const response = responseMap.get(email);
      
      if (response) {
        // Respondent has a response - calculate progress
        let progress = 0;
        let completionPercentage = 0;
        
        if (response.status === 'Completed') {
          progress = survey.pages.length;
          completionPercentage = 100;
        } else if (response.status === 'InProgress') {
          progress = (response.metadata?.lastPageIndex || 0) + 1;
          completionPercentage = Math.round((progress / survey.pages.length) * 100);
        } else {
          progress = 0;
          completionPercentage = 0;
        }
        
        return {
          email: email,
          status: response.status,
          startedAt: response.startedAt,
          lastUpdated: response.startedAt,
          progress: progress,
          totalPages: survey.pages.length,
          timeSpent: response.metadata?.timeSpent || 0,
          pagesVisited: response.metadata?.pagesVisited || [],
          completionPercentage: completionPercentage
        };
      } else {
        // Respondent hasn't started yet
        return {
          email: email,
          status: 'Not Started',
          startedAt: null,
          lastUpdated: null,
          progress: 0,
          totalPages: survey.pages.length,
          timeSpent: 0,
          pagesVisited: [],
          completionPercentage: 0
        };
      }
    });

    // Sort by status priority: Completed > InProgress > Not Started, then by lastUpdated
    allRespondents.sort((a, b) => {
      const statusPriority: Record<string, number> = { 'Completed': 3, 'InProgress': 2, 'Not Started': 1 };
      const aPriority = statusPriority[a.status] || 0;
      const bPriority = statusPriority[b.status] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // If same status, sort by lastUpdated (most recent first)
      if (a.lastUpdated && b.lastUpdated) {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      
      // Not started respondents go to the end
      return a.lastUpdated ? -1 : 1;
    });

    // Apply pagination
    const totalRespondents = allRespondents.length;
    const paginatedRespondents = allRespondents.slice(skip, skip + limit);

    res.json({
      survey: {
        id: survey._id,
        title: survey.title,
        totalPages: survey.pages.length,
        totalRespondents: totalRespondents
      },
      respondentProgress: paginatedRespondents,
      pagination: {
        page,
        limit,
        total: totalRespondents,
        totalPages: Math.ceil(totalRespondents / limit),
        hasNext: page * limit < totalRespondents,
        hasPrev: page > 1
      }
    });
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

    // Validate required fields
    if (updateData.title !== undefined && (!updateData.title || updateData.title.trim() === '')) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    // Validate pages structure if provided
    if (updateData.pages !== undefined) {
      if (!Array.isArray(updateData.pages)) {
        return res.status(400).json({ error: 'Pages must be an array' });
      }
      
      for (let i = 0; i < updateData.pages.length; i++) {
        const page = updateData.pages[i];
        if (!page || typeof page !== 'object') {
          return res.status(400).json({ error: `Invalid page data at index ${i}` });
        }
        
        if (!Array.isArray(page.questions)) {
          return res.status(400).json({ error: `Questions must be an array at page ${i + 1}` });
        }
        
        if (!Array.isArray(page.branching)) {
          return res.status(400).json({ error: `Branching must be an array at page ${i + 1}` });
        }
      }
    }

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Only allow updating certain fields for security
    const allowedUpdates = ['status', 'title', 'description', 'closeDate', 'theme', 'backgroundColor', 'textColor', 'pages'];
    
    // Filter out any fields that aren't in the allowed list
    const filteredUpdates: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updateData[key];
      }
    });

    // Store original status before updating
    const originalStatus = survey.status;
    
    // Update the survey with filtered updates first
    Object.assign(survey, filteredUpdates);
    
    // Handle publish/unpublish logic AFTER status update
    if (survey.status === 'published' && originalStatus !== 'published') {
      // Publishing: remove close date and lock survey
      survey.locked = true;
      survey.closeDate = undefined;
    } else if (survey.status === 'draft' && originalStatus === 'published') {
      // Unpublishing: set close date to current time to prevent access
      survey.closeDate = new Date();
    }
    
    await survey.save();

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

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Check if survey has any responses
    const Response = mongoose.model('Response');
    const responseCount = await Response.countDocuments({ survey: surveyId });
    
    if (responseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete survey with ${responseCount} response(s). Please delete responses first.` 
      });
    }

    // Delete the survey
    await Survey.findByIdAndDelete(surveyId);

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// POST /api/surveys/:surveyId/duplicate - Duplicate survey
router.post('/:surveyId/duplicate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Generate unique slug for the duplicated survey
    const slug = await generateUniqueSlug(`${survey.title} (Copy)`);

    // Create new survey with copied data
    const duplicatedSurvey = new Survey({
      title: `${survey.title} (Copy)`,
      description: survey.description,
      slug,
      theme: survey.theme,
      backgroundColor: survey.backgroundColor,
      textColor: survey.textColor,
      pages: survey.pages,
      status: 'draft',
      allowedRespondents: [],
      createdBy: req.user._id,
      locked: false, // New survey starts unlocked
    });

    await duplicatedSurvey.save();

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

    const survey = await Survey.findOne({ _id: surveyId, createdBy: req.user._id });
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Prepare export data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      survey: {
        title: survey.title,
        description: survey.description,
        theme: survey.theme,
        pages: survey.pages,
      }
    };

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting survey:', error);
    res.status(500).json({ error: 'Failed to export survey' });
  }
});

export default router;