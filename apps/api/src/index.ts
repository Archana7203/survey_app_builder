import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';

import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';
import questionRoutes from './routes/questions';
import responseRoutes from './routes/responses';
import analyticsRoutes from './routes/analytics';
import templateRoutes from './routes/templates';
import { seedTemplates } from './utils/seedTemplates';
import { log, morganMiddleware } from './logger';

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
const mongoUri = process.env.MONGODB_URI;

// --- Connect to MongoDB ---
if (!mongoUri) {
  log.error('No MONGO_URI provided. Please set it in env.', 'DB_CONNECTION');
  process.exit(1);
}

async function connectDatabase() {
  try {
    await mongoose.connect(mongoUri as string);
    log.info('Connected to MongoDB', 'DB_CONNECTION');
    await seedTemplates();
    log.info('Templates seeded successfully', 'SEED_TEMPLATES');
  } catch (err: any) {
    log.error('MongoDB connection failed', 'DB_CONNECTION', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

connectDatabase();

// --- Middleware ---
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : undefined,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Add Morgan middleware for HTTP logging
app.use(morganMiddleware);

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  log.info('Health check endpoint called', 'HEALTH_CHECK');
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// --- Test Endpoint ---
app.get('/api/test', (_req, res) => {
  log.info('Test endpoint called', 'TEST_ENDPOINT');
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
  log.info('Client connected', 'SOCKET_CONNECTION', { socketId: socket.id });

  socket.on('join-survey', (surveyId) => {
    socket.join(`survey-${surveyId}`);
    log.info('Client joined survey room', 'SOCKET_JOIN_SURVEY', { socketId: socket.id, surveyId });
  });

  socket.on('disconnect', () => {
    log.info('Client disconnected', 'SOCKET_DISCONNECT', { socketId: socket.id });
  });
});

// --- Serve React frontend (if bundled together) ---
const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('/{*any}', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

// --- Global Error Handler ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error(err.message || 'Internal Server Error', 'ERROR_HANDLER', {
    stack: err.stack,
    reqBody: req.body,
    reqParams: req.params,
    reqQuery: req.query,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// --- Start server ---
server.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`, 'SERVER_START', { port: PORT });
});