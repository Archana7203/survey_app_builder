import express from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
const service = new AnalyticsService();

router.get('/:surveyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user._id;

    const analytics = await service.getSurveyAnalytics(surveyId, userId);

    if (!analytics) {
      return res.status(404).json({ error: 'Survey not found or you do not have permission to view this survey' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

