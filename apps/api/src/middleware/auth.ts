import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { User } from '../models/User';
import log from '../logger';

export interface AuthRequest extends Request {
  user?: any;
  survey?: any;
}

// Middleware to check SSO session (for SSO authentication)
export const requireSSO = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.session?.user) {
    // SSO session exists
    (req as any).user = {
      email: req.session.user.email,
      name: req.session.user.name,
      oid: req.session.user.oid,
      ssoAuth: true
    };
    return next();
  }
  
  res.status(401).json({ error: 'Unauthenticated - SSO session required' });
};

// Updated requireAuth to support both JWT and SSO
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for SSO session first
    if (req.session?.user) {
      // For SSO users, find or create a User record in database
      let user = await User.findOne({ email: req.session.user.email }).select('-passwordHash');
      
      if (!user) {
        // Create a new user record for SSO authentication
        user = new User({
          email: req.session.user.email,
          name: req.session.user.name,
          role: 'creator', // Default role for SSO users (they can create surveys)
          oid: req.session.user.oid, // Store Azure AD OID
          ssoAuth: true
        });
        await user.save();
        log.info('Created new user from SSO', 'SSO_USER_CREATE', { 
          userId: (user._id as any).toString(),
          email: user.email 
        });
      }
      
      req.user = user;
      return next();
    }

    // Fall back to JWT authentication
    const authHeader = req.headers.authorization;
    const bearer = authHeader?.startsWith('Bearer ')
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
    res.status(401).json({error});
  }
};





