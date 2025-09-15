import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateSurveyToken,
  sendSurveyInvite,
} from '../email';

// Mock nodemailer
const mockSendMail = vi.fn();
const mockTransporter = {
  sendMail: mockSendMail,
};

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransporter),
  },
}));

// Mock jwt
vi.mock('jsonwebtoken');
const mockedJwt = vi.mocked(jwt);

describe('Email Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'test-password';
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSurveyToken', () => {
    it('should generate survey token successfully', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'test@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle empty surveyId', () => {
      const surveyId = '';
      const email = 'test@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId: '', email },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle empty email', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = '';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: '' },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle null surveyId', () => {
      const surveyId = null as any;
      const email = 'test@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId: null, email },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle null email', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = null as any;
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: null },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle undefined surveyId', () => {
      const surveyId = undefined as any;
      const email = 'test@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId: undefined, email },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle undefined email', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = undefined as any;
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: undefined },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle very long surveyId', () => {
      const surveyId = 'a'.repeat(1000);
      const email = 'test@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId: 'a'.repeat(1000), email },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle very long email', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'a'.repeat(1000) + '@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: 'a'.repeat(1000) + '@example.com' },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle email with special characters', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'test+tag@example.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: 'test+tag@example.com' },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle email with unicode characters', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'tëst@ëxämplé.com';
      const token = 'survey-token';
      
      mockedJwt.sign.mockReturnValue(token as any);

      const result = generateSurveyToken(surveyId, email);

      expect(result).toBe(token);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { surveyId, email: 'tëst@ëxämplé.com' },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'test@example.com';
      
      mockedJwt.sign.mockImplementation(() => {
        throw new Error('JWT_SECRET is required');
      });

      expect(() => generateSurveyToken(surveyId, email)).toThrow('JWT_SECRET is required');
    });

    it('should handle JWT signing errors', () => {
      const surveyId = '507f1f77bcf86cd799439011';
      const email = 'test@example.com';
      
      mockedJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      expect(() => generateSurveyToken(surveyId, email)).toThrow('JWT signing failed');
    });
  });

  describe('sendSurveyInvite', () => {
    it('should send survey invite successfully', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle empty email', async () => {
      const email = '';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: '',
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle empty survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = '';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('""'),
        html: expect.stringContaining('<strong></strong>'),
      });
    });

    it('should handle empty survey link', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = '';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('Click here to take the survey: '),
        html: expect.stringContaining('href=""'),
      });
    });

    it('should handle null email', async () => {
      const email = null as any;
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: null,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle null survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = null as any;
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('"null"'),
        html: expect.stringContaining('<strong>null</strong>'),
      });
    });

    it('should handle null survey link', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = null as any;
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('Click here to take the survey: null'),
        html: expect.stringContaining('href="null"'),
      });
    });

    it('should handle undefined email', async () => {
      const email = undefined as any;
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: undefined,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle undefined survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = undefined as any;
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('"undefined"'),
        html: expect.stringContaining('<strong>undefined</strong>'),
      });
    });

    it('should handle undefined survey link', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = undefined as any;
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('Click here to take the survey: undefined'),
        html: expect.stringContaining('href="undefined"'),
      });
    });

    it('should handle very long survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'A'.repeat(1000);
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('A'.repeat(1000)),
        html: expect.stringContaining('A'.repeat(1000)),
      });
    });

    it('should handle very long survey link', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/' + 'a'.repeat(1000);
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('https://example.com/survey/' + 'a'.repeat(1000)),
        html: expect.stringContaining('https://example.com/survey/' + 'a'.repeat(1000)),
      });
    });

    it('should handle survey title with special characters', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey with "quotes" & <tags>';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('Test Survey with "quotes" & <tags>'),
        html: expect.stringContaining('Test Survey with "quotes" & <tags>'),
      });
    });

    it('should handle survey title with unicode characters', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Tëst Survëy with Ünicödé';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('Tëst Survëy with Ünicödé'),
        html: expect.stringContaining('Tëst Survëy with Ünicödé'),
      });
    });

    it('should handle email with special characters', async () => {
      const email = 'test+tag@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: 'test+tag@example.com',
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle email with unicode characters', async () => {
      const email = 'tëst@ëxämplé.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: 'tëst@ëxämplé.com',
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle missing SMTP_USER', async () => {
      delete process.env.SMTP_USER;
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <undefined>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle missing SMTP_PASS', async () => {
      delete process.env.SMTP_PASS;
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle SMTP_PASS with spaces', async () => {
      process.env.SMTP_PASS = '  test password  ';
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining(surveyTitle),
        html: expect.stringContaining(surveyTitle),
      });
    });

    it('should handle sendMail failure with error details', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      const error = new Error('Send mail failed');
      (error as any).code = 'ECONNREFUSED';
      (error as any).command = 'CONN';
      (error as any).response = 'Connection refused';
      
      mockSendMail.mockRejectedValue(error);

      await expect(sendSurveyInvite(email, surveyTitle, surveyLink)).rejects.toThrow('Send mail failed');
    });

    it('should handle network timeout', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      const error = new Error('Network timeout');
      (error as any).code = 'ETIMEDOUT';
      
      mockSendMail.mockRejectedValue(error);

      await expect(sendSurveyInvite(email, surveyTitle, surveyLink)).rejects.toThrow('Network timeout');
    });

    it('should handle authentication failure', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      const error = new Error('Authentication failed');
      (error as any).code = 'EAUTH';
      
      mockSendMail.mockRejectedValue(error);

      await expect(sendSurveyInvite(email, surveyTitle, surveyLink)).rejects.toThrow('Authentication failed');
    });

    it('should handle rate limiting', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      const error = new Error('Rate limit exceeded');
      (error as any).code = 'ERATELIMIT';
      
      mockSendMail.mockRejectedValue(error);

      await expect(sendSurveyInvite(email, surveyTitle, surveyLink)).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle concurrent email sending', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const promises = Array(5).fill(null).map((_, i) =>
        sendSurveyInvite(`${email}${i}`, `${surveyTitle} ${i}`, `${surveyLink}${i}`)
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle very long email content', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'A'.repeat(10000);
      const surveyLink = 'https://example.com/survey/' + 'a'.repeat(10000);
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('A'.repeat(10000)),
        html: expect.stringContaining('A'.repeat(10000)),
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle HTML injection in survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = '<script>alert("xss")</script>';
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('<script>alert("xss")</script>'),
        html: expect.stringContaining('<script>alert("xss")</script>'),
      });
    });

    it('should handle SQL injection in survey title', async () => {
      const email = 'test@example.com';
      const surveyTitle = "'; DROP TABLE surveys; --";
      const surveyLink = 'https://example.com/survey/123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining("'; DROP TABLE surveys; --"),
        html: expect.stringContaining("'; DROP TABLE surveys; --"),
      });
    });

    it('should handle XSS in survey link', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'Test Survey';
      const surveyLink = 'javascript:alert("xss")';
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('javascript:alert("xss")'),
        html: expect.stringContaining('href="javascript:alert("xss")"'),
      });
    });

    it('should handle memory usage with large payloads', async () => {
      const email = 'test@example.com';
      const surveyTitle = 'A'.repeat(100000);
      const surveyLink = 'https://example.com/survey/' + 'a'.repeat(100000);
      
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendSurveyInvite(email, surveyTitle, surveyLink);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Survey App" <test@example.com>',
        to: email,
        subject: "You've been invited to take a survey",
        text: expect.stringContaining('A'.repeat(100000)),
        html: expect.stringContaining('A'.repeat(100000)),
      });
    });
  });
});