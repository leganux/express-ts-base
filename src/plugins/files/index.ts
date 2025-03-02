import { IPlugin } from '../../types/plugin';
import { Express, Request } from 'express';
import { validateFilesEnv } from './validation/env';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';
import routes from './routes';
import { v4 as uuidv4 } from 'uuid';
import { FileModel, IFile } from './models/file.model';

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
        const uuid = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uuid}${ext}`);
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

  private async getSignedUrl(key: string): Promise<string> {
    if (!this.s3Client) throw new Error('S3 client not initialized');
    
    const command = new GetObjectCommand({
      Bucket: this.config.AWS_S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  }

  private async uploadToS3(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    const { year, month } = this.getYearMonthPath();
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    const key = `uploads/${year}/${month}/${uuid}${ext}`;
    
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      logger.info('File uploaded to S3:', { key });
      // Return signed URL for immediate access
      const url = await this.getSignedUrl(key);
      return { url, key };
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw error;
    }
  }

  private getLocalFilePath(filename: string): string {
    return path.join(this.config.FILE_UPLOAD_PATH, filename);
  }

  async listFiles(): Promise<IFile[]> {
    return await FileModel.find().sort({ createdAt: -1 });
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

  async handleSingleUpload(file: Express.Multer.File): Promise<IFile> {
    try {
      const { year, month } = this.getYearMonthPath();
      let filePath: string;
      let fileName: string;

      if (this.config.FILE_STORAGE_TYPE === 's3') {
        const { url, key } = await this.uploadToS3(file);
        filePath = key; // Store the S3 key in path for consistent access
        fileName = path.basename(key);
      } else {
        await this.ensureDirectoryExists(path.join(this.config.FILE_UPLOAD_PATH, year, month));
        filePath = file.path;
        fileName = file.filename;
      }

      const fileDoc = await FileModel.create({
        originalName: file.originalname,
        fileName: fileName,
        extension: path.extname(file.originalname),
        path: filePath,
        mimeType: file.mimetype,
        size: file.size,
      });

      return fileDoc;
    } catch (error) {
      logger.error('Error handling single file upload:', error);
      throw error;
    }
  }

  async handleMultipleUploads(files: Express.Multer.File[]): Promise<IFile[]> {
    try {
      const uploadPromises = files.map(file => this.handleSingleUpload(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error handling multiple file uploads:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const file = await FileModel.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      if (this.config.FILE_STORAGE_TYPE === 's3') {
        const key = file.path.includes('.com/') 
          ? file.path.split('.com/')[1] 
          : file.path.startsWith('uploads/') ? file.path : `uploads/${file.path}`;
        await this.deleteFromS3(key);
      } else {
        await this.deleteLocalFile(file.path);
      }

      await FileModel.findByIdAndDelete(fileId);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    if (this.config.FILE_STORAGE_TYPE === 's3') {
      // For S3, generate a signed URL
      return await this.getSignedUrl(key);
    }
    // For local files, return the file path
    return key;
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
    try {
      // Initialize MongoDB connection if not already connected
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/express-ts-base');
      }

      const storageService = new StorageService(process.env);

      // Only create upload directory for local storage
      if (storageService.getStorageType() === 'local') {
        const uploadPath = storageService.getUploadPath();
        await fs.mkdir(uploadPath, { recursive: true });
        logger.info('Created local upload directory:', { uploadPath });
      }

      app.locals.storageService = storageService;
      app.use('/api/v1/files', routes);

      logger.info('Files plugin initialized successfully');
    } catch (error) {
      logger.error('Error initializing files plugin:', error);
      throw error;
    }
  }
}

export default FilesPlugin;
