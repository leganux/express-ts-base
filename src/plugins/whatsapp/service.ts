import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import path from 'path';
import { WhatsAppMessage } from './models/message.model';
import { WhatsAppChat } from './models/chat.model';
import { WhatsAppFileModel, IWhatsAppFile } from './models/file.model';
import { validateWhatsappEnv, WhatsAppEnvConfig } from './validation/env';
import { Express } from 'express';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';
import { WhatsAppStorageService } from './storage.service';

export class WhatsAppService {
    private static instance: WhatsAppService;
    private store = makeInMemoryStore({});
    private client: any = null;
    private currentQR: string | null = null;
    private storageService: WhatsAppStorageService;
    private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
    private hasNewMessages: boolean = false;
    private config: WhatsAppEnvConfig;

    private constructor(env: Record<string, any>) {
        this.config = validateWhatsappEnv(env);
        this.storageService = WhatsAppStorageService.getInstance({
            type: this.config.WHATSAPP_MEDIA_STORAGE_TYPE as 's3' | 'local',
            uploadPath: this.config.WHATSAPP_UPLOAD_PATH,
            s3: this.config.WHATSAPP_MEDIA_STORAGE_TYPE === 's3' ? {
                bucket: env.AWS_S3_BUCKET,
                region: env.AWS_REGION,
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY
            } : undefined
        });
    }

    public static getInstance(env?: Record<string, any>): WhatsAppService {
        if (!WhatsAppService.instance) {
            if (!env) {
                throw new Error('Environment required for initialization');
            }
            WhatsAppService.instance = new WhatsAppService(env);
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

    private async saveMediaFromMessage(msg: any, type: string): Promise<mongoose.Types.ObjectId | null> {
        try {
            if (!msg) {
                logger.warn('No message object provided');
                return null;
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

                try {
                    const savedFile = await this.saveMedia(file, type);
                    return savedFile as mongoose.Types.ObjectId;
                } catch (saveError) {
                    logger.error('Failed to save media:', saveError);
                    return null;
                }
            } catch (downloadError) {
                logger.error('Failed to download media:', downloadError);
                return null;
            }
        } catch (error) {
            logger.error('Error in saveMediaFromMessage:', error);
            return null;
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
                let fileId: mongoose.Types.ObjectId | null = null;

                if (msg.message?.imageMessage || msg.message?.videoMessage ||
                    msg.message?.audioMessage || msg.message?.stickerMessage) {
                    let type = '';
                    if (msg.message.imageMessage) type = 'jpg';
                    else if (msg.message.videoMessage) type = 'mp4';
                    else if (msg.message.audioMessage) type = 'mp3';
                    else if (msg.message.stickerMessage) type = 'webp';

                    fileId = await this.saveMediaFromMessage(msg, type);
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
                        file: fileId,
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
        }).populate('file').sort({ createdAt: 1 });
    }

    async saveMedia(file: Express.Multer.File, type: string): Promise<mongoose.Types.ObjectId> {
        try {
            const filePath = await this.storageService.saveFile(
                file.buffer,
                file.originalname,
                file.mimetype
            );

            const whatsappFile = await WhatsAppFileModel.create({
                originalName: file.originalname,
                path: filePath,
                mimeType: file.mimetype,
                size: file.size
            }) as IWhatsAppFile & { _id: mongoose.Types.ObjectId };

            if (!whatsappFile._id) {
                throw new Error('Failed to create file record: Invalid ObjectId');
            }

            return whatsappFile._id;
        } catch (error: any) {
            logger.error('Error saving media:', error);
            throw new Error(`Failed to save media: ${error?.message || 'Unknown error'}`);
        }
    }

    async sendMessage(to: string, content: string, type: 'text' | 'image' | 'video' | 'audio' = 'text', mediaPath?: string): Promise<any> {
        if (!this.client || !this.isConnected()) {
            throw new Error('WhatsApp is not connected');
        }

        try {
            let message: any = {};
            let fileId: mongoose.Types.ObjectId | null = null;

            if (type === 'text') {
                message = { text: content };
            } else if (mediaPath) {
                let fileBuffer: Buffer;
                let file: IWhatsAppFile | null = null;

                if (mongoose.Types.ObjectId.isValid(mediaPath)) {
                    // If mediaPath is a file ID, get the file from the database
                    file = await WhatsAppFileModel.findById(mediaPath);
                    if (!file) {
                        throw new Error('File not found');
                    }
                    fileBuffer = await this.storageService.getFileBuffer(file.path);
                    fileId = file._id;
                } else {
                    // If mediaPath is a direct path
                    fileBuffer = await this.storageService.getFileBuffer(mediaPath);
                }

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
                file: fileId,
                timestamp: Date.now(),
            };

            const savedMessage = await WhatsAppMessage.create(messageData);
            return savedMessage;
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
        return await this.storageService.getFileUrl(key);
    }
}
