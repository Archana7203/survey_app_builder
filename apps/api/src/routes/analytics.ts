import express from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';  // ✅ Import logger

const router = express.Router();
const service = new AnalyticsService();

router.get('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user._id;

    log.info('Fetching survey analytics', 'GET_ANALYTICS', { 
      surveyId, 
      userId: userId.toString() 
    });

    const analytics = await service.getSurveyAnalytics(surveyId, userId);

    if (!analytics) {
      log.warn('Survey not found or unauthorized', 'GET_ANALYTICS', { 
        surveyId, 
        userId: userId.toString() 
      });
      return res.status(404).json({ error: 'Survey not found or you do not have permission to view this survey' });
    }

    log.httpResponse(req, res, analytics, 'GET_ANALYTICS');
    res.json(analytics);
  } catch (error) {
    log.error('Failed to fetch analytics', 'GET_ANALYTICS', { 
      surveyId: req.params.surveyId,
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
