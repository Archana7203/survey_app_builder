import { Response, NextFunction } from 'express';
import { Survey } from '../models/Survey';
import { AuthRequest } from './auth';

export const ensureSurveyEditable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const surveyId = req.params.surveyId;
    
    if (!surveyId) {
      res.status(400).json({ error: 'Survey ID required' });
      return;
    }

    const survey = await Survey.findById(surveyId);
    
    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    // Check if survey is locked and user is the creator
    if (survey.locked && survey.createdBy?.toString() === req.user?._id?.toString()) {
      // Allow status updates (publish/unpublish) even for locked surveys
      const updateData = req.body;
      if (updateData.status !== undefined) {
        // Store survey in request for route handlers
        req.survey = survey;
        next();
        return;
      }
      
      res.status(403).json({ error: 'Survey locked after first publish' });
      return;
    }

    // Store survey in request for route handlers
    req.survey = survey;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error checking survey editability' });
  }
};
