// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

console.log('=== STARTING SERVER INITIALIZATION ===');

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import configurations
import { connectDatabase } from './config/database';
import passportConfig from './config/passport';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteRoutes';

// Import utils
import { initializeIndex } from './utils/elasticsearch';

// Create Express app
const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Passport initialization
app.use(passportConfig.initialize());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NoteMitra API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join note room
  socket.on('join_note', (noteId: string) => {
    socket.join(`note_${noteId}`);
    console.log(`User ${socket.id} joined note room: ${noteId}`);
  });

  // Leave note room
  socket.on('leave_note', (noteId: string) => {
    socket.leave(`note_${noteId}`);
    console.log(`User ${socket.id} left note room: ${noteId}`);
  });

  // New comment
  socket.on('new_comment', (data) => {
    io.to(`note_${data.noteId}`).emit('comment_added', data);
  });

  // Edit comment
  socket.on('edit_comment', (data) => {
    io.to(`note_${data.noteId}`).emit('comment_edited', data);
  });

  // Delete comment
  socket.on('delete_comment', (data) => {
    io.to(`note_${data.noteId}`).emit('comment_deleted', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io to app for use in routes
app.set('io', io);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('=== ENTERING startServer() ===');
  try {
    // Connect to database (optional - won't crash if it fails)
    try {
      await connectDatabase();
    } catch (dbError) {
      console.warn('⚠ Database setup error (continuing):', (dbError as Error).message);
    }

    // Initialize ElasticSearch (optional - won't crash if it fails)
    try {
      await initializeIndex();
    } catch (esError) {
      console.warn('⚠ ElasticSearch setup error (continuing):', (esError as Error).message);
    }

    // Start listening - this should never fail
    console.log('=== CALLING httpServer.listen() ===');
    await new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(PORT, () => {
        console.log('');
        console.log('='.repeat(50));
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ API available at: http://localhost:${PORT}/api`);
        console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
        console.log('='.repeat(50));
        console.log('');
        resolve();
      }).on('error', (err) => {
        console.error('Failed to start HTTP server:', err);
        reject(err);
      });

      // Keep server alive
      server.on('listening', () => {
        console.log('HTTP server is listening and ready');
      });
    });

    // Keep the process alive with setInterval
    setInterval(() => {
      // This keeps the event loop active
    }, 1000000);

  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Retrying in 5 seconds...');
    setTimeout(() => startServer(), 5000);
  }
};

console.log('=== CALLING startServer() ===');
startServer().catch((error) => {
  console.error('=== Server startup failed ===', error);
  console.error('Retrying in 5 seconds...');
  setTimeout(() => startServer(), 5000);
});
console.log('=== AFTER startServer() call ===');

// Handle unhandled promise rejections - NEVER EXIT
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Server will continue running...');
});

// Handle uncaught exceptions - NEVER EXIT
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Server will continue running...');
});

export { app, io };
