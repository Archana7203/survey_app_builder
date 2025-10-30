import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import log from '../logger';

/**
 * Generate JWT token for survey access
 */
export const generateSurveyToken = (surveyId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return jwt.sign(
    { surveyId, email },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * Create Nodemailer transporter based on SMTP configuration
 */
const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp-mail.outlook.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are required');
  }

  // Configuration for Outlook/Office365
  const transporterConfig: any = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    requireTLS: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  // Add TLS configuration for Outlook/Office365
  if (smtpHost.includes('outlook') || smtpHost.includes('office365')) {
    transporterConfig.tls = {
      ciphers: 'SSLv3',
    };
  }

  log.debug('Creating Nodemailer transporter', 'createTransporter', {
    host: smtpHost,
    port: smtpPort,
  });

  return nodemailer.createTransport(transporterConfig);
};

/**
 * Send survey invitation email using Nodemailer
 * 
 * @param email - Recipient email address
 * @param surveyTitle - Title of the survey
 * @param surveyLink - Link to the survey
 */
export const sendSurveyInvite = async (
  email: string,
  surveyTitle: string,
  surveyLink: string
): Promise<void> => {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!fromEmail) {
    throw new Error('SMTP_FROM or SMTP_USER environment variable is required');
  }

  try {
    const transporter = createTransporter();

    log.debug('Sending email via Nodemailer SMTP', 'sendSurveyInvite', {
      to: email,
      from: fromEmail,
      subject: surveyTitle,
    });

    // Email message configuration
    const mailOptions = {
      from: `"Survey Builder" <${fromEmail}>`,
      to: email,
      subject: "You've been invited to take a survey",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">You've been invited to take a survey</h2>
  
  <p>Hello,</p>
  
  <p>You've been invited to take the survey: <strong>${surveyTitle}</strong></p>
  
  <div style="margin: 30px 0;">
    <a href="${surveyLink}" 
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Take the Survey
    </a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="color: #666; word-break: break-all;">${surveyLink}</p>
    
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #666; font-size: 14px;">
    Best regards,<br>
    Survey Builder Team
  </p>
</body>
</html>
      `.trim(),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    log.info('Email sent successfully via SMTP', 'sendSurveyInvite', {
      to: email,
      messageId: info.messageId,
    });

  } catch (error: any) {
    log.error('Failed to send email via SMTP', 'sendSurveyInvite', {
      to: email,
      error: error.message || 'Unknown error',
      code: error.code,
    });

    // Provide helpful error messages based on error type
    let errorMessage = error.message || 'Failed to send email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check SMTP_USER and SMTP_PASS in your .env file. For Outlook/Office365, use an App Password if 2FA is enabled.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = `Connection timeout. Check SMTP_HOST (${process.env.SMTP_HOST}) and SMTP_PORT (${process.env.SMTP_PORT}).`;
    } else if (error.code === 'ECONNECTION') {
      errorMessage = `Unable to connect to SMTP server at ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}. Check your network connection and firewall settings.`;
    }

    throw new Error(`Failed to send email: ${errorMessage}`);
  }
};