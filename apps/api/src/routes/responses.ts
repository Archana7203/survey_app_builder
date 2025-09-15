import express from 'express';
import { Response } from '../models/Response';
import { Survey } from '../models/Survey';
import { validateRespondent, RespondentRequest } from '../middleware/validateRespondent';

const router = express.Router();

// GET /api/responses - Get all responses for overview/analytics
router.get('/', async (req, res) => {
  try {
    const responses = await Response.find()
      .populate('survey', 'title status')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent responses for overview
    
    const totalResponses = await Response.countDocuments();
    const completedResponses = await Response.countDocuments({ status: 'Completed' });
    
    res.json({
      responses,
      totalResponses,
      completedResponses,
      recentResponses: responses.slice(0, 10) // Last 10 responses for recent activity
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// PUT /api/responses/:surveyId/auto-save
router.put('/:surveyId/auto-save', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const { responses, metadata, status, updatedAt } = req.body;
    const email = req.respondentEmail!;

    // Validate required fields
    if (!responses || !metadata || !status || !updatedAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate status
    if (status !== 'InProgress') {
      return res.status(400).json({ error: 'Invalid status for auto-save' });
    }

    // Find or create response document
    const responseDoc = await Response.findOneAndUpdate(
      { survey: surveyId, respondentEmail: email },
      {
        $set: {
          responses,
          'metadata.lastPageIndex': metadata.lastPageIndex,
          'metadata.timeSpent': metadata.timeSpent,
          'metadata.pagesVisited': metadata.pagesVisited,
          status,
          updatedAt,
        },
        $setOnInsert: {
          startedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({ message: 'Progress auto-saved' });
  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// POST /api/responses/:surveyId/submit - Final submission endpoint
router.post('/:surveyId/submit', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const { responses, metadata } = req.body;
    const email = req.respondentEmail!;

    // Validate required fields
    if (!responses || !metadata) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the survey to check if it's still active
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.status !== 'published') {
      return res.status(400).json({ error: 'Survey is not published' });
    }

    // Check if survey has a close date and if it's passed
    if (survey.closeDate && new Date(survey.closeDate) < new Date()) {
      return res.status(400).json({ error: 'Survey has closed' });
    }

    // Find existing response or create new one
    const existingResponse = await Response.findOne({
      survey: surveyId,
      respondentEmail: email,
    });

    if (existingResponse?.status === 'Completed') {
      return res.status(400).json({ error: 'Survey already submitted' });
    }

    // Update or create response document
    const responseDoc = await Response.findOneAndUpdate(
      { survey: surveyId, respondentEmail: email },
      {
        $set: {
          responses,
          'metadata.lastPageIndex': metadata.lastPageIndex,
          'metadata.timeSpent': metadata.timeSpent,
          'metadata.pagesVisited': metadata.pagesVisited,
          status: 'Completed',
          submittedAt: new Date(),
        },
        $setOnInsert: {
          startedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`survey-${surveyId}`).emit('response_submitted', {
        surveyId,
        responseId: responseDoc._id,
      });
    }

    res.json({ message: 'Survey submitted successfully' });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

export default router;