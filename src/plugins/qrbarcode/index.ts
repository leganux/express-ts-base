import { Router } from 'express';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import mongoose from 'mongoose';
import { Code } from './models/code.model';
import { logger } from '../../utils/logger';
import config from '../config.json';

// Define routes in a separate function to match other plugins
const setupRoutes = (plugin: QRBarcodePlugin) => {
    const router = Router();

    router.post('/qr', async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }
            const qrCode = await plugin.generateQR(text);
            res.json({ data: qrCode });
        } catch (error) {
            res.status(500).json({ error: 'Error generating QR code' });
        }
    });

    router.post('/barcode', async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Text is required' });
            }
            const barcode = await plugin.generateBarcode(text);
            res.json({ data: barcode });
        } catch (error) {
            res.status(500).json({ error: 'Error generating barcode' });
        }
    });

    return router;
};

export class QRBarcodePlugin implements IPlugin {    
    name = 'qrbarcode';
    version = config.qrbarcode.version;

    async generateQR(text: string): Promise<string> {
        try {
            const qrCode = await QRCode.toDataURL(text);
            // Save to database
            await Code.create({
                text,
                type: 'qr',
                format: 'base64'
            });
            return qrCode;
        } catch (err) {
            logger.error('Error generating QR code:', err);
            throw new Error('Error generating QR code');
        }
    }

    async generateBarcode(text: string): Promise<string> {
        try {
            const canvas = createCanvas(400, 100);
            JsBarcode(canvas, text, {
                format: "CODE128",
                width: 2,
                height: 100,
                displayValue: true
            });
            const barcode = canvas.toDataURL();
            // Save to database
            await Code.create({
                text,
                type: 'barcode',
                format: 'base64',
                barcodeType: 'CODE128'
            });
            return barcode;
        } catch (err) {
            logger.error('Error generating barcode:', err);
            throw new Error('Error generating barcode');
        }
    }

    async initialize(app: Express): Promise<void> {
        // Check if plugin is enabled in config
        if (!config.qrbarcode.enabled) {
            logger.info('QR/Barcode plugin is disabled');
            return;
        }

        // Register routes using path from config
        const routePath = config.qrbarcode.config.routes;
        app.use(routePath, setupRoutes(this));

        logger.info('QR/Barcode plugin initialized successfully');
    }
}

export default QRBarcodePlugin;
