import express from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthRequest } from '../middleware/auth';
import log from '../logger';  // ✅ Import logger

const router = express.Router();
const service = new AuthService();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    log.info('User registration attempt', 'REGISTER', { email, role });
    
    const { user, accessToken, refreshToken } = await service.register(email, password, role);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info('User registered successfully', 'REGISTER', { 
      userId: (user._id as any).toString(), 
      email: user.email, 
      role: user.role 
    });
    
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    log.error('Registration failed', 'REGISTER', { 
      email: req.body.email,
      error: error.message,
      stack: error.stack 
    });
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    log.info('Login attempt', 'LOGIN', { email });
    const { user, accessToken, refreshToken } = await service.login(email, password);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info('Login successful', 'LOGIN', { 
      userId: (user._id as any).toString(), 
      email: user.email 
    });
    
    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    log.warn('Login failed', 'LOGIN', { 
      email: req.body.email,
      error: error.message 
    });
    res.status(401).json({ error: error.message || 'Server error' });
  }
});

// Refresh
router.post('/refresh', async (req, res) => {
  try {
    log.info('Token refresh attempt', 'REFRESH_TOKEN');
    
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await service.refresh(refreshToken);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    
    log.info('Token refreshed successfully', 'REFRESH_TOKEN');
    res.json({ message: 'Token refreshed' });
  } catch (error: any) {
    log.warn('Token refresh failed', 'REFRESH_TOKEN', { 
      error: error.message 
    });
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  log.info('User logged out', 'LOGOUT');
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id.toString();
    log.info('Fetching current user', 'GET_ME', { userId });
    const user = await service.getCurrentUser(userId);

    log.httpResponse(req, res, { user }, 'GET_ME');
    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    log.error('Failed to fetch current user', 'GET_ME', { 
      userId: req.user?._id.toString(),
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: error.message || 'Server error' });
  }
});
export default router;
