import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string): string => {
  // Fallback to JWT_SECRET in case JWT_REFRESH_SECRET isn't set (e.g., test env)
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.sign({ userId }, secret, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.verify(token, secret) as { userId: string };
};

// Token for respondents to access a specific survey without account login
// Encodes surveyId and respondent email in a short-lived token
export const generateRespondentToken = (surveyId: string, email: string): string => {
  return jwt.sign(
    { surveyId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};





