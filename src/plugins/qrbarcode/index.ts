import { Router } from 'express';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import mongoose from 'mongoose';
import { Code } from './models/code.model';
import { logger } from '../../utils/logger';

export class QRBarcodePlugin implements IPlugin {
    private router: Router;
    
    name = 'qrbarcode';
    version = '1.0.0';

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.post('/qr', async (req, res) => {
            try {
                const { text } = req.body;
                if (!text) {
                    return res.status(400).json({ error: 'Text is required' });
                }
                const qrCode = await this.generateQR(text);
                res.json({ data: qrCode });
            } catch (error) {
                res.status(500).json({ error: 'Error generating QR code' });
            }
        });

        this.router.post('/barcode', async (req, res) => {
            try {
                const { text } = req.body;
                if (!text) {
                    return res.status(400).json({ error: 'Text is required' });
                }
                const barcode = await this.generateBarcode(text);
                res.json({ data: barcode });
            } catch (error) {
                res.status(500).json({ error: 'Error generating barcode' });
            }
        });
    }

    private async generateQR(text: string): Promise<string> {
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

    private async generateBarcode(text: string): Promise<string> {
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
        app.use('/qrbarcode', this.router);
        logger.info('QR/Barcode plugin initialized successfully');
    }
}

export default QRBarcodePlugin;
