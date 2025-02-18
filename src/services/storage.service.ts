import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { validateEnv } from '../config/env.validator';
import { logger } from '../utils/logger';

const config = validateEnv();

// Configure multer for local storage
const localStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, config.FILE_UPLOAD_PATH);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure multer for memory storage (for S3)
const memoryStorage = multer.memoryStorage();

// Configure S3 client
const s3Client = config.FILE_STORAGE_TYPE === 's3' ? new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  }
}) : null;

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only images and PDFs
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
  }
};

// Create multer instance based on storage type
export const upload = multer({
  storage: config.FILE_STORAGE_TYPE === 'local' ? localStorage : memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to handle S3 upload
async function uploadToS3(file: Express.Multer.File): Promise<string> {
  if (!s3Client) throw new Error('S3 client not initialized');

  const key = `uploads/${Date.now()}-${file.originalname}`;
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    logger.info('File uploaded to S3:', { key });
    return `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw error;
  }
}

// Function to handle local file path
function getLocalFilePath(filename: string): string {
  return `${config.FILE_UPLOAD_PATH}/${filename}`;
}

// Function to delete file from S3
async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client) throw new Error('S3 client not initialized');

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key
    }));
    logger.info('File deleted from S3:', { key });
  } catch (error) {
    logger.error('Error deleting from S3:', error);
    throw error;
  }
}

// Function to delete local file
async function deleteLocalFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
    logger.info('Local file deleted:', { filepath });
  } catch (error) {
    logger.error('Error deleting local file:', error);
    throw error;
  }
}

export const storageService = {
  // Handle single file upload
  async handleSingleUpload(file: Express.Multer.File): Promise<string> {
    try {
      if (config.FILE_STORAGE_TYPE === 's3') {
        return await uploadToS3(file);
      } else {
        return getLocalFilePath(file.filename);
      }
    } catch (error) {
      logger.error('Error handling single file upload:', error);
      throw error;
    }
  },

  // Handle multiple file uploads
  async handleMultipleUploads(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => {
        if (config.FILE_STORAGE_TYPE === 's3') {
          return uploadToS3(file);
        } else {
          return Promise.resolve(getLocalFilePath(file.filename));
        }
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error handling multiple file uploads:', error);
      throw error;
    }
  },

  // Delete file
  async deleteFile(filepath: string): Promise<void> {
    try {
      if (config.FILE_STORAGE_TYPE === 's3') {
        const key = filepath.split('.com/')[1];
        await deleteFromS3(key);
      } else {
        await deleteLocalFile(filepath);
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }
};
