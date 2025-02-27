import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { connectDB } from './config/database';
import { logger, stream } from './utils/logger';
import { validateEnv } from './config/env.validator';
import PluginLoader from './utils/plugin-loader';

// Function to automatically load routes from modules
const loadModuleRoutes = (app: express.Application) => {
  const modulesPath = path.join(__dirname, 'modules');

  // Read all directories in modules folder
  const modules = fs.readdirSync(modulesPath).filter(file => {
    return fs.statSync(path.join(modulesPath, file)).isDirectory() && file !== '.DS_Store';
  });

  // Load routes from each module
  for (const moduleName of modules) {
    try {
      const routePath = path.join(modulesPath, moduleName, 'routes');
      const routes = require(routePath).default;
      app.use(`/api/v1/${moduleName}`, routes);
      logger.info(`****** Loaded routes for module: ${moduleName}`);
    } catch (error) {
      logger.error(`Failed to load routes for module ${moduleName}:`, error);
    }
  };
};
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

// Load module routes
loadModuleRoutes(app);

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

// Connect to MongoDB, load plugins and start server
connectDB().then(async () => {
  // Initialize and load plugins
  const pluginLoader = PluginLoader.getInstance();
  await pluginLoader.loadPlugins(app);

  app.listen(config.PORT, () => {
    logger.info(`Server is running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    logger.info(`API Documentation: http://localhost:${config.PORT}/api-docs`);


  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
