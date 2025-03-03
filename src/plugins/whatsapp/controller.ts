import { Request, Response } from 'express';
import * as QRCode from 'qrcode';
import { WhatsAppService } from './service';
import { logger } from '../../utils/logger';
import { WhatsAppFileModel } from './models/file.model';

export class WhatsAppController {
    private service: WhatsAppService;

    constructor(service: WhatsAppService) {
        this.service = service;
    }

    public async getStatus(req: Request, res: Response): Promise<Response> {
        try {
            const state = await this.service.getState();
            return res.json({
                error: null,
                success: true,
                message: 'Status retrieved successfully',
                code: 200,
                data: state
            });
        } catch (error) {
            logger.error('Error in getStatus:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error',
                success: false,
                message: 'Failed to get status',
                code: 500,
                data: {}
            });
        }
    }

    public async getQR(req: Request, res: Response): Promise<Response> {
        try {
            const qr = this.service.getCurrentQR();
            if (!qr) {
                return res.status(400).json({
                    error: 'QR code not available',
                    success: false,
                    message: 'QR code is not available at this time',
                    code: 400,
                    data: {}
                });
            }
            const qrDataUrl = await QRCode.toDataURL(qr);
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f0f2f5;
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                            background: white;
                            border-radius: 10px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #128C7E;
                            margin-bottom: 20px;
                        }
                        img {
                            max-width: 300px;
                            height: auto;
                        }
                        p {
                            color: #666;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>WhatsApp QR Code</h1>
                        <img src="${qrDataUrl}" alt="WhatsApp QR Code">
                        <p>Scan this QR code with WhatsApp to connect</p>
                    </div>
                </body>
                </html>
            `);
        } catch (error) {
            logger.error('Error in getQR:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Error generating QR code',
                success: false,
                message: 'Failed to generate QR code',
                code: 500,
                data: {}
            });
        }
    }

    public async updateChatName(req: Request, res: Response): Promise<Response> {
        try {
            const { jid } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({
                    error: 'Name is required',
                    success: false,
                    message: 'Name field is required',
                    code: 400,
                    data: {}
                });
            }

            await this.service.updateChatName(jid, name);
            return res.json({
                error: null,
                success: true,
                message: 'Chat name updated successfully',
                code: 200,
                data: { jid, name }
            });
        } catch (error) {
            logger.error('Error updating chat name:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to update chat name',
                success: false,
                message: 'Failed to update chat name',
                code: 500,
                data: {}
            });
        }
    }

    public async getChatsList(req: Request, res: Response): Promise<Response> {
        try {
            const chats = await this.service.getChats();
            return res.json({
                error: null,
                success: true,
                message: 'Chats retrieved successfully',
                code: 200,
                data: chats
            });
        } catch (error) {
            logger.error('Error in getChats:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to get chats',
                success: false,
                message: 'Failed to get chats',
                code: 500,
                data: {}
            });
        }
    }

    public async getMessagesList(req: Request, res: Response): Promise<Response> {
        try {
            const messages = await this.service.getMessages(req.params.jid);
            return res.json({
                error: null,
                success: true,
                message: 'Messages retrieved successfully',
                code: 200,
                data: messages
            });
        } catch (error) {
            logger.error('Error in getMessages:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to get messages',
                success: false,
                message: 'Failed to get messages',
                code: 500,
                data: {}
            });
        }
    }

    public async sendMessageHandler(req: Request, res: Response): Promise<Response> {
        try {
            const { to, content, type, mediaPath } = req.body;

            if (!to || !content) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    success: false,
                    message: 'To and content fields are required',
                    code: 400,
                    data: {}
                });
            }

            const message = await this.service.sendMessage(to, content, type, mediaPath);
            return res.json({
                error: null,
                success: true,
                message: 'Message sent successfully',
                code: 200,
                data: message
            });
        } catch (error) {
            logger.error('Error in sendMessage:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to send message',
                success: false,
                message: 'Failed to send message',
                code: 500,
                data: {}
            });
        }
    }

    public async sendMediaMessageHandler(req: Request, res: Response): Promise<Response> {
        try {
            const file = req.file;
            const { to, type, content } = req.body;

            if (!file || !to || !type) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    success: false,
                    message: 'File, to, and type fields are required',
                    code: 400,
                    data: {}
                });
            }

            // Save file and get the file ID
            const fileId = await this.service.saveMedia(file, type);

            // Send message with the file ID
            const message = await this.service.sendMessage(to, content || '', type, fileId.toString());

            return res.json({
                error: null,
                success: true,
                message: 'Media message sent successfully',
                code: 200,
                data: { message }
            });
        } catch (error) {
            logger.error('Error in sendMediaMessage:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to send media message',
                success: false,
                message: 'Failed to send media message',
                code: 500,
                data: {}
            });
        }
    }
}
