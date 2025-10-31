import express from 'express';
import { SurveyRespondentsService } from '../services/surveyRespondents.service';
import { SurveyService } from '../services/survey.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';

const router = express.Router();
const service = new SurveyRespondentsService();
const surveyService = new SurveyService();

// GET /api/surveys/:id/respondents - Get respondents for a survey
router.get('/:id/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId } = req.params;

    // Verify survey ownership
    await surveyService.getSurveyById(req.user._id.toString(), surveyId);

    log.info('Fetching survey respondents', 'GET_SURVEY_RESPONDENTS', {
      userId: req.user._id.toString(),
      surveyId,
    });

    const surveyRespondents = await service.getBySurveyIdIdsOnly(surveyId);


    if (!surveyRespondents) {
      return res.json({
        surveyId,
        allowedRespondents: [],
        allowedGroups: [],
        invitations: [],
      });
    }

    log.info('Survey respondents fetched', 'GET_SURVEY_RESPONDENTS', {
      userId: req.user._id.toString(),
      surveyId,
      respondentCount: surveyRespondents.allowedRespondents?.length || 0,
      groupCount: surveyRespondents.allowedGroups?.length || 0,
    });

    res.json(surveyRespondents);
  } catch (error: any) {
    log.error('Error fetching survey respondents', 'GET_SURVEY_RESPONDENTS', {
      userId: req.user?._id?.toString(),
      surveyId: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch survey respondents' });
    }
  }
});

// PATCH /api/surveys/:id/respondents - Merge respondents and groups
router.patch('/:id/respondents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId } = req.params;
    const { respondentIds = [], groupIds = [] } = req.body;

    // Verify survey ownership
    await surveyService.getSurveyById(req.user._id.toString(), surveyId);

    // Extract IDs from objects if needed
    const extractedRespondentIds = respondentIds.map((id: any) => 
      typeof id === 'string' ? id : (id?._id || id?.id || id)
    ).filter((id: any): id is string => id && typeof id === 'string');
    
    const extractedGroupIds = groupIds.map((id: any) => 
      typeof id === 'string' ? id : (id?._id || id?.id || id)
    ).filter((id: any): id is string => id && typeof id === 'string');

    log.info('Merging survey respondents', 'PATCH_SURVEY_RESPONDENTS', {
      userId: req.user._id.toString(),
      surveyId,
      respondentCount: extractedRespondentIds.length,
      groupCount: extractedGroupIds.length,
    });

    // Validate input
    if (!Array.isArray(respondentIds) || !Array.isArray(groupIds)) {
      return res.status(400).json({ 
        error: 'respondentIds and groupIds must be arrays' 
      });
    }

    const result = await service.mergeRecipients(
      surveyId,
      extractedRespondentIds,
      extractedGroupIds
    );

    log.info('Survey respondents merged successfully', 'PATCH_SURVEY_RESPONDENTS', {
      userId: req.user._id.toString(),
      surveyId,
      totalInvitations: result.invitations?.length || 0,
    });

    res.json(result);
  } catch (error: any) {
    log.error('Error merging survey respondents', 'PATCH_SURVEY_RESPONDENTS', {
      userId: req.user?._id?.toString(),
      surveyId: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to merge survey respondents' });
    }
  }
});

// GET /api/surveys/:id/respondents/invitations - Get invitations for a survey
router.get('/:id/respondents/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId } = req.params;

    // Verify survey ownership
    await surveyService.getSurveyById(req.user._id.toString(), surveyId);

    log.info('Fetching survey invitations', 'GET_SURVEY_INVITATIONS', {
      userId: req.user._id.toString(),
      surveyId,
    });

    const invitations = await service.getInvitations(surveyId);

    log.info('Survey invitations fetched', 'GET_SURVEY_INVITATIONS', {
      userId: req.user._id.toString(),
      surveyId,
      count: invitations.length,
    });

    res.json({ invitations });
  } catch (error: any) {
    log.error('Error fetching survey invitations', 'GET_SURVEY_INVITATIONS', {
      userId: req.user?._id?.toString(),
      surveyId: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch invitations' });
    }
  }
});

// POST /api/surveys/:id/respondents/send-invitations - Trigger sending pending invitations
router.post('/:id/respondents/send-invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId } = req.params;

    // Verify survey ownership
    await surveyService.getSurveyById(req.user._id.toString(), surveyId);

    const concurrency = Number.parseInt((req.query.concurrency as string) || '5', 10);
    log.info('Triggering send invitations', 'SEND_INVITATIONS', {
      userId: req.user._id.toString(),
      surveyId,
      concurrency,
    });

    const result = await service.sendPendingInvitations(surveyId, Math.max(1, Math.min(concurrency, 20)));
    res.json(result);
  } catch (error: any) {
    log.error('Error sending invitations', 'SEND_INVITATIONS', {
      userId: req.user?._id?.toString(),
      surveyId: req.params.id,
      error: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to send invitations' });
  }
});

// GET /api/surveys/:id/respondents/count - Get respondent counts
router.get('/:id/respondents/count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId } = req.params;

    // Verify survey ownership
    await surveyService.getSurveyById(req.user._id.toString(), surveyId);

    log.info('Counting survey respondents', 'COUNT_SURVEY_RESPONDENTS', {
      userId: req.user._id.toString(),
      surveyId,
    });

    const respondentCount = await service.countRespondents(surveyId);
    const groupCount = await service.countGroups(surveyId);

    res.json({
      respondentCount,
      groupCount,
      total: respondentCount + groupCount,
    });
  } catch (error: any) {
    log.error('Error counting survey respondents', 'COUNT_SURVEY_RESPONDENTS', {
      userId: req.user?._id?.toString(),
      surveyId: req.params.id,
      error: error.message,
    });

    if (error.message.includes('not found') || error.message.includes('no permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to count respondents' });
    }
  }
});

export default router;

