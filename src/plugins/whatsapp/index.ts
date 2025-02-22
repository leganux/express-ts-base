import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import makeWASocket, { 
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    downloadMediaMessage,
    proto
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import * as qrcode from 'qrcode-terminal';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { WhatsAppMessage } from './models/message.model';
import { WhatsAppChat } from './models/chat.model';
import routes from './routes';

class WhatsAppService {
    private socket: SocketServer | null = null;
    private store = makeInMemoryStore({});
    private client: any = null;
    private currentQR: string | null = null;
    private storageService: any;

    isConnected(): boolean {
        return this.client !== null;
    }

    getCurrentQR(): string | null {
        return this.currentQR;
    }

    constructor(app: Express, server?: Server) {
        this.storageService = app.locals.storageService;
        
        if (server) {
            this.socket = new SocketServer(server, {
                cors: {
                    origin: '*'
                }
            });
            this.setupSocketEvents();
        }
    }

    private setupSocketEvents() {
        if (!this.socket) return;

        this.socket.on('connection', (socket) => {
            console.log('Client connected to WhatsApp socket');

            socket.on('disconnect', () => {
                console.log('Client disconnected from WhatsApp socket');
            });
        });
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
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        this.client = makeWASocket({
            printQRInTerminal: true,
            auth: state,
        });

        this.store.bind(this.client.ev);

        this.client.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.currentQR = qr;
                // Emit QR code to socket clients
                this.socket?.emit('whatsapp:qr', qr);
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    await this.connect();
                }
            }

            if (connection === 'open') {
                console.log('WhatsApp connected!');
                this.socket?.emit('whatsapp:connected');
                this.setupMessageHandler();
            }
        });

        this.client.ev.on('creds.update', saveCreds);
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

                this.socket?.emit('whatsapp:message', messageData);
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
        if (!this.client) throw new Error('WhatsApp client not initialized');

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

            await this.client.sendMessage(to, message);
            return true;
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
        const whatsappService = new WhatsAppService(app);
        await whatsappService.connect();
        app.locals.whatsappService = whatsappService;
        app.use('/api/v1/whatsapp', routes);
    }
}

export default WhatsAppPlugin;
