import makeWASocket, { 
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs/promises';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { WhatsAppMessage } from './models/message.model';
import { WhatsAppChat } from './models/chat.model';
import { WhatsAppFileModel } from './models/file.model';
import { validateWhatsappEnv, WhatsAppEnvConfig } from './validation/env';
import { Express } from 'express';
import { logger } from '../../utils/logger';

export class WhatsAppService {
    private static instance: WhatsAppService;
    private store = makeInMemoryStore({});
    private client: any = null;
    private currentQR: string | null = null;
    private storageService: any;
    private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
    private hasNewMessages: boolean = false;
    private config: WhatsAppEnvConfig;

    private constructor(env: Record<string, any>, storageService: any) {
        this.config = validateWhatsappEnv(env);
        this.storageService = storageService;
    }

    public static getInstance(env?: Record<string, any>, storageService?: any): WhatsAppService {
        if (!WhatsAppService.instance) {
            if (!env || !storageService) {
                throw new Error('Environment and storage service required for initialization');
            }
            WhatsAppService.instance = new WhatsAppService(env, storageService);
        }
        return WhatsAppService.instance;
    }

    isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    getCurrentQR(): string | null {
        return this.currentQR;
    }

    async getState() {
        return {
            connected: this.connectionState === 'connected',
            state: this.connectionState,
            hasNewMessages: this.hasNewMessages
        };
    }

    private setNewMessages(value: boolean) {
        this.hasNewMessages = value;
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    private getYearMonthPath(): { year: string, month: string, fullPath: string } {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const fullPath = path.join(this.config.WHATSAPP_UPLOAD_PATH, year, month);
        return { year, month, fullPath };
    }

    private async saveMediaFromMessage(msg: any, type: string): Promise<string> {
        try {
            if (!msg) {
                logger.warn('No message object provided');
                return '';
            }

            try {
                const buffer = await downloadMediaMessage(msg, 'buffer', {});

                const file: Express.Multer.File = {
                    fieldname: 'whatsapp',
                    originalname: `${Date.now()}.${type}`,
                    encoding: '7bit',
                    mimetype: `${type === 'webp' ? 'image' : type}/${type}`,
                    buffer: buffer as Buffer,
                    size: (buffer as Buffer).length,
                    destination: '',
                    filename: '',
                    path: '',
                    stream: null as any
                };

                return await this.saveMedia(file, type);
            } catch (downloadError) {
                logger.error('Failed to download media:', downloadError);
                return '';
            }
        } catch (error) {
            logger.error('Error in saveMediaFromMessage:', error);
            return '';
        }
    }

    async connect(): Promise<void> {
        try {
            this.connectionState = 'connecting';
            const { state, saveCreds } = await useMultiFileAuthState(this.config.WHATSAPP_AUTH_FOLDER);
            
            this.client = makeWASocket({
                printQRInTerminal: true,
                auth: state,
            });

            this.store.bind(this.client.ev);

            this.client.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    logger.info('New QR code received');
                    this.currentQR = qr;
                    this.connectionState = 'disconnected';
                    qrcode.generate(qr, { small: true });
                }

                if (connection === 'close') {
                    this.connectionState = 'disconnected';
                    this.currentQR = null;
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    if (shouldReconnect) {
                        logger.info('Connection closed, attempting to reconnect...');
                        await this.connect();
                    } else {
                        logger.info('Connection closed, logged out');
                    }
                }

                if (connection === 'open') {
                    logger.info('WhatsApp connected successfully!');
                    this.connectionState = 'connected';
                    this.currentQR = null;
                    this.setupMessageHandler();
                }
            });

            this.client.ev.on('creds.update', saveCreds);
        } catch (error) {
            logger.error('Error in connect:', error);
            this.connectionState = 'disconnected';
            throw error;
        }
    }

    private setupMessageHandler() {
        this.client.ev.on('messages.upsert', async (m: any) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === 'notify') {
                let mediaUrl = '';
                
                if (msg.message?.imageMessage || msg.message?.videoMessage || 
                    msg.message?.audioMessage || msg.message?.stickerMessage) {
                    let type = '';
                    if (msg.message.imageMessage) type = 'jpg';
                    else if (msg.message.videoMessage) type = 'mp4';
                    else if (msg.message.audioMessage) type = 'mp3';
                    else if (msg.message.stickerMessage) type = 'webp';
                    
                    mediaUrl = await this.saveMediaFromMessage(msg, type);
                }

                try {
                    const jid = msg.key.remoteJid.replace('@s.whatsapp.net', '');
                    const messageData = {
                        messageId: msg.key.id,
                        from: jid,
                        type: Object.keys(msg.message || {})[0],
                        content: msg.message?.conversation || 
                                msg.message?.extendedTextMessage?.text || 
                                (msg.message?.stickerMessage ? 'Sticker' : '') ||
                                (msg.message?.imageMessage ? 'Image' : '') ||
                                (msg.message?.videoMessage ? 'Video' : '') ||
                                (msg.message?.audioMessage ? 'Audio' : '') || '',
                        mediaUrl,
                        timestamp: msg.messageTimestamp,
                    };

                    await WhatsAppMessage.create(messageData);

                    await WhatsAppChat.findOneAndUpdate(
                        { jid },
                        {
                            lastMessageTimestamp: msg.messageTimestamp,
                            $inc: { unreadCount: 1 }
                        },
                        { upsert: true }
                    );

                    this.setNewMessages(true);
                } catch (error) {
                    logger.error('Error handling incoming message:', error);
                }
            }
        });
    }

    async getChats() {
        if (!this.client) throw new Error('WhatsApp client not initialized');
        this.setNewMessages(false);
        return WhatsAppChat.find().sort({ lastMessageTimestamp: -1 });
    }

    async getMessages(jid: string) {
        if (!this.client) throw new Error('WhatsApp client not initialized');
        return WhatsAppMessage.find({
            $or: [
                { from: jid },
                { from: 'me', to: jid }
            ]
        }).sort({ timestamp: 1 });
    }

    async saveMedia(file: Express.Multer.File, type: string): Promise<string> {
        try {
            const { year, month } = this.getYearMonthPath();
            const uuid = Date.now().toString();
            const ext = path.extname(file.originalname);
            const key = `uploads/whatsapp/${year}/${month}/${uuid}${ext}`;

            if (this.config.WHATSAPP_MEDIA_STORAGE_TYPE === 's3') {
                await this.storageService.s3Client.send(new PutObjectCommand({
                    Bucket: this.storageService.getS3Config().bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype
                }));
            } else {
                const fullPath = path.join(this.config.WHATSAPP_UPLOAD_PATH, year, month);
                await this.ensureDirectoryExists(fullPath);
                await fs.writeFile(path.join(fullPath, path.basename(key)), file.buffer);
            }

            await WhatsAppFileModel.create({
                originalName: file.originalname,
                path: key,
                mimeType: file.mimetype,
                size: file.size
            });

            return key;
        } catch (error) {
            logger.error('Error saving media:', error);
            throw error;
        }
    }

    async sendMessage(to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' = 'text', mediaPath?: string): Promise<any> {
        if (!this.client || !this.isConnected()) {
            throw new Error('WhatsApp is not connected');
        }

        try {
            let message: any = {};

            if (type === 'text') {
                message = { text: content };
            } else if (mediaPath) {
                const fileBuffer = await fs.readFile(mediaPath);
                
                switch (type) {
                    case 'image':
                        message = {
                            image: fileBuffer,
                            caption: content || undefined
                        };
                        break;
                    case 'video':
                        message = {
                            video: fileBuffer,
                            caption: content || undefined
                        };
                        break;
                    case 'audio':
                        message = {
                            audio: fileBuffer,
                            mimetype: 'audio/mp4'
                        };
                        break;
                    default:
                        throw new Error(`Unsupported media type: ${type}`);
                }
            } else {
                throw new Error('Media path is required for media messages');
            }

            const fullJid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
            const result = await this.client.sendMessage(fullJid, message);
            
            const messageData = {
                messageId: result.key.id,
                from: 'me',
                to: to.replace('@s.whatsapp.net', ''),
                type,
                content,
                mediaUrl: mediaPath,
                timestamp: Date.now(),
            };

            return await WhatsAppMessage.create(messageData);
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async updateChatName(jid: string, name: string): Promise<void> {
        if (!this.client) throw new Error('WhatsApp client not initialized');
        
        await WhatsAppChat.findOneAndUpdate(
            { jid },
            { name },
            { upsert: true }
        );
    }

    async getFileUrl(key: string): Promise<string> {
        if (this.config.WHATSAPP_MEDIA_STORAGE_TYPE === 's3') {
            return await this.storageService.getFileUrl(key);
        }
        return key;
    }
}
