import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';
import questionRoutes from './routes/questions';
import responseRoutes from './routes/responses';
import analyticsRoutes from './routes/analytics';
import templateRoutes from './routes/templates';

import { seedTemplates } from './utils/seedTemplates';

dotenv.config();

const app = express();
const server = createServer(app);

// Use env-based CORS (comma-separated URLs), falls back to allowing same-origin
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    credentials: true,
  },
});
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (optional for development)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/survey_app';
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed templates on startup
    await seedTemplates();
  })
  .catch((err) => {
    console.warn('MongoDB connection failed, API will work with limited functionality:', err.message);
    console.log('To enable full functionality, make sure MongoDB is running or set MONGO_URI environment variable');
  });

// Middleware
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : undefined,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running', timestamp: new Date().toISOString() });
});

// Test surveys endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Make io available to routes
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join survey room for real-time updates
  socket.on('join-survey', (surveyId) => {
    socket.join(`survey-${surveyId}`);
    console.log(`Client ${socket.id} joined survey room: ${surveyId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve React build (single-app deployment)
import path from 'path';
const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});