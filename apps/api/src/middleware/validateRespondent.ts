import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Survey } from '../models/Survey';
import { SurveyRespondentsService } from '../services/surveyRespondents.service';
import log from '../logger';

export interface RespondentRequest extends Request {
  respondentEmail?: string;
}

const surveyRespondentsService = new SurveyRespondentsService();

export const validateRespondent = async (
  req: RespondentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from query params or Authorization header
    const token = req.query.token as string || req.headers.authorization?.split(' ')[1];

    if (!token || token.trim() === '') {
      log.warn('No token provided', 'validateRespondent');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      log.error('JWT_SECRET not configured', 'validateRespondent');
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as { surveyId: string; email: string };
    
    // Check if this token is for the correct survey
    if (decoded.surveyId !== req.params.surveyId) {
      log.warn('Token survey ID mismatch', 'validateRespondent', {
        tokenSurveyId: decoded.surveyId,
        paramsSurveyId: req.params.surveyId,
      });
      res.status(403).json({ error: 'Invalid token for this survey' });
      return;
    }

    // Verify survey exists
    const survey = await Survey.findById(decoded.surveyId);
    if (!survey) {
      log.warn('Survey not found', 'validateRespondent', {
        surveyId: decoded.surveyId,
      });
      res.status(404).json({ error: 'Survey not found' });
      return;
    }

    // Get all respondent emails from SurveyRespondents (includes direct respondents and group members)
    const allowedEmails = await surveyRespondentsService.getAllRespondentEmails(decoded.surveyId);

    // Check if email is authorized
    if (!allowedEmails.includes(decoded.email.toLowerCase())) {
      log.warn('Email not authorized for survey', 'validateRespondent', {
        surveyId: decoded.surveyId,
        email: decoded.email,
      });
      res.status(403).json({ error: 'Email not authorized for this survey' });
      return;
    }

    // Block if respondent has already completed the survey
    try {
      const { Response } = await import('../models/Response');
      const existing = await Response.findOne({ survey: decoded.surveyId, respondentEmail: decoded.email }).select('status');
      if (existing?.status === 'Completed') {
        log.warn('Respondent already completed survey - blocking access', 'validateRespondent', {
          surveyId: decoded.surveyId,
          email: decoded.email,
        });
        res.status(409).json({ error: 'You have already answered this survey' });
        return;
      }
    } catch (e) {
      log.warn('Check for existing completed response failed', 'validateRespondent', {
        surveyId: decoded.surveyId,
        email: decoded.email,
        error: (e as any)?.message,
      });
    }

    log.debug('Respondent validated successfully', 'validateRespondent', {
      surveyId: decoded.surveyId,
      email: decoded.email,
    });

    // Add email to request for use in route handlers
    req.respondentEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      log.warn('Invalid or expired token', 'validateRespondent', {
        error: error.message,
      });
      res.status(401).json({ error: 'Invalid or expired token' });
    } else {
      log.error('Error validating respondent', 'validateRespondent', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({ error: 'Server error' });
    }
  }
};