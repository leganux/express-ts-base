import { IPlugin } from '../../types/plugin';
import { Express, Request } from 'express';
import { validateFilesEnv } from './validation/env';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';
import routes from './routes';

export class StorageService {
  private s3Client: S3Client | null;
  private config: ReturnType<typeof validateFilesEnv>;
  public upload: multer.Multer;

  constructor(env: Record<string, any>) {
    this.config = validateFilesEnv(env);

    // Configure S3 client if using S3 storage
    this.s3Client = this.config.FILE_STORAGE_TYPE === 's3' ? new S3Client({
      region: this.config.AWS_REGION,
      credentials: {
        accessKeyId: this.config.AWS_ACCESS_KEY_ID!,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY!
      }
    }) : null;

    // Configure multer storage based on storage type
    const storage = this.config.FILE_STORAGE_TYPE === 'local' 
      ? this.configureLocalStorage()
      : multer.memoryStorage();

    // Create multer instance
    this.upload = multer({
      storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    });
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
    const fullPath = path.join(this.config.FILE_UPLOAD_PATH, year, month);
    return { year, month, fullPath };
  }

  private configureLocalStorage(): multer.StorageEngine {
    return multer.diskStorage({
      destination: async (_req: Request, _file: Express.Multer.File, cb) => {
        try {
          const { fullPath } = this.getYearMonthPath();
          await this.ensureDirectoryExists(fullPath);
          cb(null, fullPath);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (_req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });
  }

  private fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow only images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  };

  private async uploadToS3(file: Express.Multer.File): Promise<string> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    const { year, month } = this.getYearMonthPath();
    const key = `${year}/${month}/${Date.now()}-${file.originalname}`;
    
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      logger.info('File uploaded to S3:', { key });
      return `https://${this.config.AWS_S3_BUCKET}.s3.${this.config.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw error;
    }
  }

  private getLocalFilePath(filename: string): string {
    return path.join(this.config.FILE_UPLOAD_PATH, filename);
  }

  async listFiles(): Promise<{ path: string; stats: any }[]> {
    const files: { path: string; stats: any }[] = [];
    
    async function walkDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({ 
            path: fullPath,
            stats: {
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            }
          });
        }
      }
    }

    await walkDir(this.config.FILE_UPLOAD_PATH);
    return files;
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET,
        Key: key
      }));
      logger.info('File deleted from S3:', { key });
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      throw error;
    }
  }

  private async deleteLocalFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
      logger.info('Local file deleted:', { filepath });
    } catch (error) {
      logger.error('Error deleting local file:', error);
      throw error;
    }
  }

  async handleSingleUpload(file: Express.Multer.File): Promise<string> {
    try {
      const { year, month } = this.getYearMonthPath();
      if (this.config.FILE_STORAGE_TYPE === 's3') {
        return await this.uploadToS3(file);
      } else {
        // Return just the filename for API compatibility, but store in year/month structure
        await this.ensureDirectoryExists(path.join(this.config.FILE_UPLOAD_PATH, year, month));
        return file.filename;
      }
    } catch (error) {
      logger.error('Error handling single file upload:', error);
      throw error;
    }
  }

  async handleMultipleUploads(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const { year, month } = this.getYearMonthPath();
      const uploadPromises = files.map(async file => {
        if (this.config.FILE_STORAGE_TYPE === 's3') {
          return await this.uploadToS3(file);
        } else {
          // Return just the filename for API compatibility, but store in year/month structure
          await this.ensureDirectoryExists(path.join(this.config.FILE_UPLOAD_PATH, year, month));
          return file.filename;
        }
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error handling multiple file uploads:', error);
      throw error;
    }
  }

  async deleteFile(filepath: string): Promise<void> {
    try {
      if (this.config.FILE_STORAGE_TYPE === 's3') {
        const key = filepath.split('.com/')[1];
        await this.deleteFromS3(key);
      } else {
        await this.deleteLocalFile(filepath);
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  getUploadPath(): string {
    return this.config.FILE_UPLOAD_PATH;
  }

  getStorageType(): string {
    return this.config.FILE_STORAGE_TYPE;
  }

  getS3Config() {
    if (this.config.FILE_STORAGE_TYPE !== 's3') {
      throw new Error('S3 configuration not available for local storage');
    }
    return {
      bucket: this.config.AWS_S3_BUCKET,
      region: this.config.AWS_REGION
    };
  }
}

class FilesPlugin implements IPlugin {
  name = 'files';
  version = '1.0.0';

  async initialize(app: Express, mongoose: typeof import("mongoose")) {
    const storageService = new StorageService(process.env);
    app.locals.storageService = storageService;
    app.use('/api/v1/files', routes);
  }
}

export default FilesPlugin;
