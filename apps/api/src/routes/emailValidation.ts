import express from 'express';
import { validateEmailWithDNS, validateEmailWithDNSDetailed } from '../utils/emailValidation';
import log from '../logger';

const router = express.Router();

/**
 * POST /api/email-validation/validate
 * Validates email address by checking DNS MX records
 */
router.post('/validate', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'Email address is required',
      });
    }

    log.info('Validating email with DNS', 'EMAIL_VALIDATION', { email });

    const result = await validateEmailWithDNSDetailed(email);

    if (!result.valid) {
      log.warn('Email validation failed', 'EMAIL_VALIDATION', {
        email,
        ...result,
      });
    } else {
      log.info('Email validation successful', 'EMAIL_VALIDATION', {
        email,
        hasMX: result.hasMX,
        domainExists: result.domainExists,
      });
    }

    res.json(result);
  } catch (error: any) {
    log.error('Email validation error', 'EMAIL_VALIDATION', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      valid: false,
      error: 'Failed to validate email',
    });
  }
});

export default router;
