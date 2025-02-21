import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import userRoutes from './modules/users/routes';
import authRoutes from './modules/auth/routes';
import fileRoutes from './modules/files/routes';
import emailRoutes from './modules/email/routes';
import { connectDB } from './config/database';
import { logger, stream } from './utils/logger';
import { validateEnv } from './config/env.validator';

// Validate environment variables
const config = validateEnv();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('combined', { stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug(`Incoming ${req.method} request to ${req.path}`);
  logger.debug('Request Body:', req.body);
  next();
});

// Routes with v1 prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/email', emailRoutes);

// Firebase Config Route
app.get('/config', (_req: Request, res: Response) => {
  res.json({
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID,
    measurementId: config.FIREBASE_MEASUREMENT_ID
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    success: false,
    message: 'Something went wrong',
    code: 500,
    data: {}
  });
});

// Create uploads directory if using local storage
if (config.FILE_STORAGE_TYPE === 'local') {
  const uploadDir = path.resolve(config.FILE_UPLOAD_PATH);
  import('fs').then(fs => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info('Created uploads directory:', uploadDir);
    }
  }).catch(error => {
    logger.error('Error creating uploads directory:', error);
  });
}

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(config.PORT, () => {
    logger.info(`Server is running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    logger.info(`API Documentation: http://localhost:${config.PORT}/api-docs`);
    
    // Log available endpoints
    logger.info('Available endpoints:');
    logger.info('Authentication:');
    logger.info('  POST /api/v1/auth/register');
    logger.info('  POST /api/v1/auth/login');
    logger.info('  POST /api/v1/auth/google');
    logger.info('  POST /api/v1/auth/reset-password');
    logger.info('  GET  /api/v1/auth/verify');
    logger.info('  POST /api/v1/auth/set-role (Admin only)');
    
    logger.info('Files:');
    logger.info('  POST /api/v1/files/single');
    logger.info('  POST /api/v1/files/many');
    logger.info('  DELETE /api/v1/files/:filepath');
    logger.info('  GET /api/v1/files/view/:id');
    
    logger.info('Email:');
    logger.info('  POST /api/v1/email/send');
    logger.info('  POST /api/v1/email/send-template');
    logger.info('  POST /api/v1/email/send-with-attachment');
    
    logger.info('Users:');
    logger.info('  GET  /api/v1/users');
    logger.info('  GET  /api/v1/users/me');
    logger.info('  GET  /api/v1/users/:id');
    logger.info('  PUT  /api/v1/users/me');
    logger.info('  DELETE /api/v1/users/:id');
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
