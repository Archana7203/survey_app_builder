import express from 'express';
import { SendSurveyInvitationsJob } from '../jobs/sendSurveyInvitations.job';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';

const router = express.Router();

/**
 * POST /api/jobs/send-invitations
 * Manually trigger the send invitations job
 * 
 * Note: In production, you should add admin-only authorization here
 * For now, any authenticated user can trigger it
 */
router.post('/send-invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    log.info('Manually triggering send invitations job', 'TRIGGER_JOB', {
      userId: req.user._id.toString(),
      triggeredBy: req.user.email,
    });

    const job = new SendSurveyInvitationsJob();
    
    // Optionally allow setting batch size via request
    if (req.body.batchSize) {
      const batchSize = Number.parseInt(req.body.batchSize);
      if (batchSize > 0 && batchSize <= 100) {
        job.setBatchSize(batchSize);
      }
    }

    const result = await job.execute();

    log.info('Send invitations job completed', 'TRIGGER_JOB', {
      userId: req.user._id.toString(),
      result,
    });

    res.json({
      success: true,
      message: 'Send invitations job completed successfully',
      result: {
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        failedCount: result.failedCount,
        failedInvitations: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            surveyId: r.surveyId,
            respondentId: r.respondentId,
            email: r.email,
            error: r.error,
          })),
      },
    });
  } catch (error: any) {
    log.error('Failed to trigger send invitations job', 'TRIGGER_JOB', {
      userId: req.user?._id?.toString(),
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to run send invitations job',
      details: error.message,
    });
  }
});

/**
 * GET /api/jobs/pending-invitations/count
 * Get count of pending invitations
 */
router.get('/pending-invitations/count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { SurveyRespondents } = require('../models/SurveyRespondents');
    
    const result = await SurveyRespondents.aggregate([
      { $unwind: '$invitations' },
      {
        $match: {
          'invitations.status': 'pending',
        },
      },
      {
        $count: 'total',
      },
    ]);

    const count = result.length > 0 ? result[0].total : 0;

    log.debug('Pending invitations count retrieved', 'GET_PENDING_COUNT', {
      userId: req.user._id.toString(),
      count,
    });

    res.json({
      pendingInvitations: count,
    });
  } catch (error: any) {
    log.error('Failed to get pending invitations count', 'GET_PENDING_COUNT', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });

    res.status(500).json({
      error: 'Failed to get pending invitations count',
      details: error.message,
    });
  }
});

export default router;

