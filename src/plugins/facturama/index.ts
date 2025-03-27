import { Express } from 'express';
import { logger } from '../../utils/logger';
import { FacturamaService } from './services/facturama.service';
import routes from './routes';
import config from '../config.json';

class FacturamaPlugin {
    name = 'facturama';
    version = config.facturama.version;
    private service?: FacturamaService;

    constructor(apiKey?: string) {}

    async initialize(app: Express, mongoose: typeof import("mongoose")) {
        try {
            // Check if plugin is enabled in config
            if (!config.facturama.enabled) {
                logger.info('Facturama plugin is disabled');
                return;
            }

            // Initialize MongoDB connection if not already connected
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/express-ts-base');
            }

            // Initialize Facturama service
            this.service = new FacturamaService(process.env);
            app.locals.facturamaService = this.service;

            // Initialize routes using path from config
            const routePath = config.facturama.config.routes;
            app.use(routePath, routes(app));

            // Pre-fetch catalogs on startup
            await this.service.getCatalogs();

            logger.info('Facturama plugin initialized successfully');
        } catch (error) {
            logger.error('Error initializing Facturama plugin:', error);
            throw error;
        }
    }

    async destroy() {
        // Cleanup if needed
        this.service = undefined;
    }
}

export default FacturamaPlugin;
