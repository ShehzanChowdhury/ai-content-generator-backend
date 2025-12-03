import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

// Load environment variables
dotenv.config();

/**
 * Main Express server
 * Sets up all routes, middleware, and WebSocket support
 */

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Disable ETag to prevent 304 responses (not needed for undeployed app)
app.set('etag', false);

// Middleware to disable caching headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Version 1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/content', contentRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join room for specific job updates
  socket.on('subscribe-job', (jobId: string) => {
    socket.join(`job-${jobId}`);
    console.log(`📡 Client ${socket.id} subscribed to job ${jobId}`);
  });

  // Leave job room
  socket.on('unsubscribe-job', (jobId: string) => {
    socket.leave(`job-${jobId}`);
    console.log(`📡 Client ${socket.id} unsubscribed from job ${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io instance for use in worker (if needed)
export { io };

// Initialize WebSocket utilities
import { initializeWebSocket, emitJobUpdate } from './utils/websocket.js';
initializeWebSocket(io);

// Subscribe to Redis pub/sub for job updates from worker
import { getRedisClient } from './config/redis.js';
const redisSubscriber = getRedisClient().duplicate();
redisSubscriber.subscribe('job-updates', (err) => {
  if (err) {
    console.error('❌ Failed to subscribe to job-updates channel:', err);
  } else {
    console.log('📡 Subscribed to Redis job-updates channel');
  }
});

redisSubscriber.on('message', (channel, message) => {
  if (channel === 'job-updates') {
    try {
      const update = JSON.parse(message);
      emitJobUpdate(update.jobId, update);
    } catch (error) {
      console.error('❌ Error parsing job update message:', error);
    }
  }
});

// 404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

