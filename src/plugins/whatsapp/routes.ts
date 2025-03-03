import { Router, Response } from 'express';
import { WhatsAppController } from './controller';
import { createReadStream } from 'fs';
import { logger } from '../../utils/logger';
import { WhatsAppFileModel } from './models/file.model';
import axios from 'axios';
import path from 'path';

export default function whatsappRoutes(service: any) {
    const router = Router();
    const controller = new WhatsAppController(service);

    // Get connection status and QR if needed
    router.get('/status', (req, res) => controller.getStatus(req, res));

    // Get QR code as HTML page
    router.get('/qr', (req, res) => controller.getQR(req, res));

    // Update chat name
    router.put('/chat/:jid/name', (req, res) => controller.updateChatName(req, res));

    // Get all chats
    router.get('/chats', (req, res) => controller.getChatsList(req, res));

    // Get messages from a specific chat
    router.get('/messages/:jid', (req, res) => controller.getMessagesList(req, res));

    // Send a message
    router.post('/send', (req, res) => controller.sendMessageHandler(req, res));

    // Send media message
    router.post('/send-media', (req, res, next) => {
        const storageService = service['storageService'];
        if (!storageService) {
            return res.status(503).json({ error: 'Storage service not initialized' });
        }
        storageService.upload.single('file')(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            controller.sendMediaMessageHandler(req, res);
        });
    });

    // View/download a file
    router.get('/view/:id', async (req: any, res: Response) => {
        try {
            const { id } = req.params;
            const file = await WhatsAppFileModel.findById(id);

            if (!file) {
                return res.status(404).json({
                    error: 'File not found',
                    success: false,
                    message: 'The requested file does not exist',
                    code: 404
                });
            }

            try {
                if (service.config.WHATSAPP_MEDIA_STORAGE_TYPE === 'local') {
                    const filePath = path.join(service.config.WHATSAPP_UPLOAD_PATH, file.path);
                    res.setHeader('Content-Type', file.mimeType);
                    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
                    const fileStream = createReadStream(filePath);
                    fileStream.on('error', (error) => {
                        logger.error('Error reading file stream:', error);
                        res.status(500).json({
                            error: 'Failed to read file',
                            success: false,
                            message: 'Failed to read file from storage',
                            code: 500
                        });
                    });
                    fileStream.pipe(res);
                } else {
                    // For S3, download the file and stream it
                    const signedUrl = await service.getFileUrl(file.path);
                    const response = await axios.get(signedUrl, { 
                        responseType: 'stream',
                        validateStatus: function (status) {
                            return status >= 200 && status < 300;
                        }
                    });
                    res.setHeader('Content-Type', file.mimeType);
                    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
                    response.data.pipe(res);
                }
            } catch (streamError) {
                logger.error('Error streaming file:', streamError);
                res.status(500).json({
                    error: 'Failed to stream file',
                    success: false,
                    message: 'Failed to stream file from storage',
                    code: 500
                });
            }
        } catch (error) {
            logger.error('Error viewing file:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to view file',
                success: false,
                message: 'Failed to view file',
                code: 500
            });
        }
    });

    return router;
}
