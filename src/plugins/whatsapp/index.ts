import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import makeWASocket, { 
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    downloadMediaMessage,
    proto
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { WhatsAppMessage } from './models/message.model';
import { WhatsAppChat } from './models/chat.model';
import routes from './routes';

class WhatsAppService {
    private store = makeInMemoryStore({});
    private client: any = null;
    private currentQR: string | null = null;
    private storageService: any;
    private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

    isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    getCurrentQR(): string | null {
        return this.currentQR;
    }

    async getState() {
        return {
            connected: this.connectionState === 'connected',
            state: this.connectionState
        };
    }

    constructor(app: Express) {
        this.storageService = app.locals.storageService;
    }

    private async saveMedia(message: any, type: string): Promise<string> {
        try {
            const buffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
            );

            const file: Express.Multer.File = {
                fieldname: 'whatsapp',
                originalname: `${Date.now()}-${Math.random().toString(36).substring(7)}.${type}`,
                encoding: '7bit',
                mimetype: `${type}/${type}`,
                buffer: buffer as Buffer,
                size: (buffer as Buffer).length,
                destination: '',
                filename: '',
                path: '',
                stream: null as any
            };

            try {
                return await this.storageService.handleSingleUpload(file);
            } catch (error) {
                console.log('Failed to upload to storage service:', error);
                
                // Fallback to local storage
                const uploadDir = join(process.cwd(), 'uploads', 'whatsapp');
                await mkdir(uploadDir, { recursive: true });
                const filePath = join(uploadDir, file.originalname);
                await writeFile(filePath, buffer as Buffer);
                return `/uploads/whatsapp/${file.originalname}`;
            }
        } catch (error) {
            console.error('Error saving media:', error);
            throw error;
        }
    }

    async connect(): Promise<void> {
        try {
            this.connectionState = 'connecting';
            const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
            
            this.client = makeWASocket({
                printQRInTerminal: true,
                auth: state,
            });

            this.store.bind(this.client.ev);

            this.client.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log('New QR code received');
                    this.currentQR = qr;
                    this.connectionState = 'disconnected';
                    qrcode.generate(qr, { small: true });
                }

                if (connection === 'close') {
                    this.connectionState = 'disconnected';
                    this.currentQR = null;
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    if (shouldReconnect) {
                        console.log('Connection closed, attempting to reconnect...');
                        await this.connect();
                    } else {
                        console.log('Connection closed, logged out');
                    }
                }

                if (connection === 'open') {
                    console.log('WhatsApp connected successfully!');
                    this.connectionState = 'connected';
                    this.currentQR = null;
                    this.setupMessageHandler();
                }
            });

            this.client.ev.on('creds.update', saveCreds);
        } catch (error) {
            console.error('Error in connect:', error);
            this.connectionState = 'disconnected';
            throw error;
        }
    }

    private setupMessageHandler() {
        this.client.ev.on('messages.upsert', async (m: any) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === 'notify') {
                let mediaUrl = '';
                
                if (msg.message?.imageMessage) {
                    mediaUrl = await this.saveMedia(msg.message, 'jpg');
                } else if (msg.message?.videoMessage) {
                    mediaUrl = await this.saveMedia(msg.message, 'mp4');
                } else if (msg.message?.audioMessage) {
                    mediaUrl = await this.saveMedia(msg.message, 'mp3');
                } else if (msg.message?.stickerMessage) {
                    mediaUrl = await this.saveMedia(msg.message, 'webp');
                }

                try {
                    const messageData = {
                        messageId: msg.key.id,
                        from: msg.key.remoteJid,
                        type: Object.keys(msg.message || {})[0],
                        content: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '',
                        mediaUrl,
                        timestamp: msg.messageTimestamp,
                    };

                    // Store message in database
                    await WhatsAppMessage.create(messageData);

                    // Update or create chat
                    await WhatsAppChat.findOneAndUpdate(
                        { jid: msg.key.remoteJid },
                        {
                            lastMessageTimestamp: msg.messageTimestamp,
                            $inc: { unreadCount: 1 }
                        },
                        { upsert: true }
                    );
                } catch (error) {
                    console.error('Error handling incoming message:', error);
                }
            }
        });
    }

    async getChats() {
        if (!this.client) throw new Error('WhatsApp client not initialized');
        return WhatsAppChat.find().sort({ lastMessageTimestamp: -1 });
    }

    async getMessages(jid: string) {
        if (!this.client) throw new Error('WhatsApp client not initialized');
        return WhatsAppMessage.find({ from: jid }).sort({ timestamp: -1 });
    }

    async sendMessage(to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' = 'text', mediaPath?: string) {
        if (!this.client || !this.isConnected()) {
            throw new Error('WhatsApp is not connected');
        }

        try {
            let message: any = {};

            switch (type) {
                case 'text':
                    message = { text: content };
                    break;
                case 'image':
                    message = {
                        image: { url: mediaPath! },
                        caption: content
                    };
                    break;
                case 'video':
                    message = {
                        video: { url: mediaPath! },
                        caption: content
                    };
                    break;
                case 'audio':
                    message = {
                        audio: { url: mediaPath! },
                        mimetype: 'audio/mp4'
                    };
                    break;
            }

            const result = await this.client.sendMessage(to, message);
            
            // Create message record
            const messageData = {
                messageId: result.key.id,
                from: 'me',
                to,
                type,
                content,
                mediaUrl: mediaPath,
                timestamp: Date.now(),
            };

            return await WhatsAppMessage.create(messageData);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
}

class WhatsAppPlugin implements IPlugin {
    name = 'whatsapp';
    version = '1.0.0';

    async initialize(app: Express, mongoose: typeof import("mongoose")) {
        // Initialize WhatsApp service
        const whatsappService = new WhatsAppService(app);
        await whatsappService.connect();
        app.locals.whatsappService = whatsappService;

        // Set up routes
        const router = routes();
        app.use('/api/v1/whatsapp', router);
    }
}

export default WhatsAppPlugin;
