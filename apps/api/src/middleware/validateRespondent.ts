import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Survey } from '../models/Survey';

export interface RespondentRequest extends Request {
  respondentEmail?: string;
}

export const validateRespondent = async (
  req: RespondentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from query params or Authorization header
    const token = req.query.token as string || req.headers.authorization?.split(' ')[1];

    if (!token || token.trim() === '') {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { surveyId: string; email: string };
    
    // Check if this token is for the correct survey
    if (decoded.surveyId !== req.params.surveyId) {
      res.status(403).json({ error: 'Invalid token for this survey' });
      return;
    }

    // Check if email is in allowedRespondents
    const survey = await Survey.findById(decoded.surveyId);
    if (!survey) {
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    if (!survey.allowedRespondents.includes(decoded.email)) {
      res.status(403).json({ error: 'Email not authorized for this survey' });
      return;
    }

    // Add email to request for use in route handlers
    req.respondentEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};
