import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';
import questionRoutes from './routes/questions';
import responseRoutes from './routes/responses';
import analyticsRoutes from './routes/analytics';
import templateRoutes from './routes/templates';
import { seedTemplates } from './utils/seedTemplates';

// Load env (only needed locally, Heroku ignores .env)
dotenv.config();

const app = express();
const server = createServer(app);

// Allowed CORS origins (comma-separated in env)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI;

// --- Connect to MongoDB ---
if (!mongoUri) {
  console.error("❌ No MONGO_URI provided. Please set it in env.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await seedTemplates();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // fail fast on prod
  });

// --- Middleware ---
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : undefined,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// --- Test Endpoint ---
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// --- Attach Socket.io to app ---
app.set('io', io);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

// --- Socket.io handlers ---
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-survey', (surveyId) => {
    socket.join(`survey-${surveyId}`);
    console.log(`📢 Client ${socket.id} joined survey room: ${surveyId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- Serve React frontend (if bundled together) ---
const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('/*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
