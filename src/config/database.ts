import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { validateEnv } from './env.validator';

export const connectDB = async (): Promise<void> => {
  try {
    const config = validateEnv();
    logger.info('Attempting to connect to MongoDB at:', config.MONGODB_URI);
    
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    const db = mongoose.connection;
    
    db.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    db.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    db.on('reconnectFailed', () => {
      logger.error('MongoDB reconnection failed');
    });
    
    process.on('SIGINT', async () => {
      try {
        await db.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
    
    db.once('open', () => {
      logger.info('MongoDB connection established successfully');
      logger.debug('Connected to database:', {
        name: db.name,
        host: db.host,
        port: db.port,
        models: Object.keys(db.models)
      });
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
