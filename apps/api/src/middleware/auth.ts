import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
  survey?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Support cookie or Authorization header bearer token (used in tests sometimes)
    const authHeader = req.headers.authorization;
    const bearer = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    const token = req.cookies.accessToken || bearer;

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};





