import express from 'express';
import { ResponseService } from '../services/response.service';
import { validateRespondent, RespondentRequest } from '../middleware/validateRespondent';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';  

const router = express.Router();

// GET /api/responses - Get responses for overview/analytics scoped to current user's surveys
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    log.info('Fetching responses overview', 'GET_RESPONSES', { 
      userId: req.user!._id.toString() 
    });
    
    const service = new ResponseService();
    const overview = await service.getOverviewForCreator(req.user!._id.toString());
    res.json(overview);
  } catch (error) {
    log.error('Failed to fetch responses', 'GET_RESPONSES', { 
      userId: req.user?._id.toString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// PUT /api/responses/:surveyId/auto-save
router.put('/:surveyId/auto-save', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const email = req.respondentEmail!;
    
    log.info('Auto-saving response', 'AUTO_SAVE', { 
      surveyId, 
      email,
      dataSize: JSON.stringify(req.body).length 
    });
    
    const service = new ResponseService();
    const result = await service.autoSave(surveyId, email, req.body);
    
    log.httpResponse(req, res, result, 'AUTO_SAVE');
    res.json(result);
  } catch (error) {
    log.error('Auto-save failed', 'AUTO_SAVE', { 
      surveyId: req.params.surveyId,
      email: req.respondentEmail,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// POST /api/responses/:surveyId/submit - Final submission endpoint
router.post('/:surveyId/submit', validateRespondent, async (req: RespondentRequest, res) => {
  try {
    const { surveyId } = req.params;
    const email = req.respondentEmail!;
    
    log.info('Submitting survey response', 'SUBMIT_RESPONSE', { 
      surveyId, 
      email,
      dataSize: JSON.stringify(req.body).length 
    });
    
    const service = new ResponseService();
    const responseDoc = await service.submit(surveyId, email, req.body);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`survey-${surveyId}`).emit('response_submitted', {
        surveyId,
        responseId: responseDoc._id,
      });
      
      log.info('Socket event emitted', 'SUBMIT_RESPONSE', { 
        surveyId,
        responseId: responseDoc._id,
        event: 'response_submitted'
      });
    }
    
    log.httpResponse(req, res, { message: 'Survey submitted successfully' }, 'SUBMIT_RESPONSE');
    res.json({ message: 'Survey submitted successfully' });
  } catch (error) {
    log.error('Survey submission failed', 'SUBMIT_RESPONSE', { 
      surveyId: req.params.surveyId,
      email: req.respondentEmail,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

export default router;