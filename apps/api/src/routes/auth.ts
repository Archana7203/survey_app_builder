import express from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
const service = new AuthService();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const { user, accessToken, refreshToken } = await service.register(email, password, role);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await service.login(email, password);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Server error' });
  }
});

// Refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await service.refresh(refreshToken);

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.json({ message: 'Token refreshed' });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id.toString(); // ✅ safe string
    const user = await service.getCurrentUser(userId);

    res.json({ user: { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
