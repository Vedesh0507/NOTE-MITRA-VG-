import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || '';

  if (!mongoURI) {
    console.warn('⚠ MONGODB_URI not configured - server will run without database');
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠ MongoDB connection failed - server will run without database');
    console.warn('Error:', (error as Error).message);
    return; // Don't throw - just continue without database
  }

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
};
