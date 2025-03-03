import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger';
import multer from 'multer';
import { Request } from 'express';

interface WhatsAppStorageConfig {
    type: 's3' | 'local';
    uploadPath?: string;
    s3?: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
}

export class WhatsAppStorageService {
    private static instance: WhatsAppStorageService;
    private s3Client: S3Client | null = null;
    private config: WhatsAppStorageConfig;
    public upload: multer.Multer;

    private constructor(config: WhatsAppStorageConfig) {
        this.config = config;
        if (config.type === 's3' && config.s3) {
            this.s3Client = new S3Client({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.accessKeyId,
                    secretAccessKey: config.s3.secretAccessKey,
                },
            });
        }

        // Configure multer storage
        const storage = multer.memoryStorage();
        this.upload = multer({
            storage: storage,
            fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
                // Accept images, videos, and audio files
                if (file.mimetype.startsWith('image/') || 
                    file.mimetype.startsWith('video/') || 
                    file.mimetype.startsWith('audio/')) {
                    cb(null, true);
                } else {
                    cb(null, false);
                    cb(new Error('Only image, video, and audio files are allowed'));
                }
            },
            limits: {
                fileSize: 100 * 1024 * 1024 // 100MB limit
            }
        });
    }

    public static getInstance(config?: WhatsAppStorageConfig): WhatsAppStorageService {
        if (!WhatsAppStorageService.instance) {
            if (!config) {
                throw new Error('Configuration required for initialization');
            }
            WhatsAppStorageService.instance = new WhatsAppStorageService(config);
        }
        return WhatsAppStorageService.instance;
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    private getYearMonthPath(): { year: string; month: string; fullPath: string } {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const fullPath = this.config.uploadPath ? 
            path.join(this.config.uploadPath, year, month) : 
            path.join('uploads', 'whatsapp', year, month);
        return { year, month, fullPath };
    }

    async saveFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
        try {
            const { year, month, fullPath } = this.getYearMonthPath();
            const uuid = Date.now().toString();
            const ext = path.extname(filename);
            const key = `whatsapp/${year}/${month}/${uuid}${ext}`;

            if (this.config.type === 's3' && this.s3Client && this.config.s3) {
                await this.s3Client.send(new PutObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                    Body: file,
                    ContentType: mimeType
                }));
                return key;
            } else {
                // Local storage
                await this.ensureDirectoryExists(fullPath);
                const filePath = path.join(fullPath, `${uuid}${ext}`);
                await fs.writeFile(filePath, file);
                return filePath;
            }
        } catch (error: any) {
            logger.error('Error saving file:', error);
            throw new Error(`Failed to save file: ${error?.message || 'Unknown error'}`);
        }
    }

    async getFileUrl(key: string): Promise<string> {
        if (this.config.type === 's3' && this.s3Client && this.config.s3) {
            const command = new GetObjectCommand({
                Bucket: this.config.s3.bucket,
                Key: key,
            });
            return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        }
        return key; // For local storage, return the file path
    }

    async getFileBuffer(key: string): Promise<Buffer> {
        try {
            if (this.config.type === 's3' && this.s3Client && this.config.s3) {
                const command = new GetObjectCommand({
                    Bucket: this.config.s3.bucket,
                    Key: key,
                });
                const response = await this.s3Client.send(command);
                if (!response.Body) {
                    throw new Error('File not found');
                }
                return Buffer.from(await response.Body.transformToByteArray());
            } else {
                // Local storage
                return await fs.readFile(key);
            }
        } catch (error: any) {
            logger.error('Error getting file:', error);
            throw new Error(`Failed to get file: ${error?.message || 'Unknown error'}`);
        }
    }
}
