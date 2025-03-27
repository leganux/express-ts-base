import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import { logger } from '../../utils/logger';
import { WhatsAppService } from './service';
import whatsappRoutes from './routes';
import fs from 'fs/promises';
import config from '../config.json';

class WhatsAppPlugin implements IPlugin {
    name = 'whatsapp';
    version = config.whatsapp.version;

    async initialize(app: Express, mongoose: typeof import("mongoose")) {
        try {
            // Check if plugin is enabled in config
            if (!config.whatsapp.enabled) {
                logger.info('WhatsApp plugin is disabled');
                return;
            }

            // Initialize MongoDB connection if not already connected
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/express-ts-base');
            }

            // Initialize WhatsApp service with validated environment
            const whatsappService = WhatsAppService.getInstance(process.env);

            // Create upload directory if using local storage
            if (process.env.WHATSAPP_MEDIA_STORAGE_TYPE !== 's3') {
                const uploadPath = whatsappService['config'].WHATSAPP_UPLOAD_PATH;
                await fs.mkdir(uploadPath, { recursive: true });
                logger.info('Created local upload directory:', { uploadPath });
            }

            // Create auth directory
            const authPath = whatsappService['config'].WHATSAPP_AUTH_FOLDER;
            await fs.mkdir(authPath, { recursive: true });
            logger.info('Created WhatsApp auth directory:', { authPath });

            // Connect to WhatsApp
            await whatsappService.connect();

            // Set up routes using path from config
            const routePath = config.whatsapp.config.routes;
            app.use(routePath, whatsappRoutes(whatsappService));

            logger.info('WhatsApp plugin initialized successfully');
        } catch (error) {
            logger.error('Error initializing WhatsApp plugin:', error);
            throw error;
        }
    }
}

export default WhatsAppPlugin;
