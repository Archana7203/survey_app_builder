import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// Create reusable transporter
const createTransporter = async () => {
  // Log current settings
  console.log('Creating SMTP transport with:', {
    email: process.env.SMTP_USER,
    pass_length: process.env.SMTP_PASS?.length || 0
  });

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s/g, ''), // Remove any spaces
    }
  });
};

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

export const sendSurveyInvite = async (
  email: string,
  surveyTitle: string,
  surveyLink: string
): Promise<void> => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Survey App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "You've been invited to take a survey",
      text: `
Hello,

You've been invited to take the survey: "${surveyTitle}"

Click here to take the survey: ${surveyLink}

This link will expire in 7 days.

Best regards,
Survey App Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">You've been invited to take a survey</h2>
  
  <p>You've been invited to take the survey: <strong>${surveyTitle}</strong></p>
  
  <div style="margin: 30px 0;">
    <a href="${surveyLink}" 
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Take the Survey
    </a>
  </div>
  
  <p style="color: #666;">This link will expire in 7 days.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #666; font-size: 14px;">
    Best regards,<br>
    Survey App Team
  </p>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('Failed to send email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};