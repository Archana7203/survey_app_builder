import express from 'express';
import { Response } from '../models/Response';
import { ResponseService } from '../services/response.service';
import { validateRespondent, RespondentRequest } from '../middleware/validateRespondent';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/responses - Get responses for overview/analytics scoped to current user's surveys
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const service = new ResponseService();
    const overview = await service.getOverviewForCreator(req.user!._id.toString());
    res.json(overview);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// PUT /api/responses/:surveyId/auto-save
router.put('/:surveyId/auto-save', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const email = req.respondentEmail!;
    const service = new ResponseService();
    const result = await service.autoSave(surveyId, email, req.body);
    res.json(result);
  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// POST /api/responses/:surveyId/submit - Final submission endpoint
router.post('/:surveyId/submit', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const email = req.respondentEmail!;
    const service = new ResponseService();
    const responseDoc = await service.submit(surveyId, email, req.body);

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