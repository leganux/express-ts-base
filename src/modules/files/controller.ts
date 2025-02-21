import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { storageService } from '../../services/storage.service';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { validateEnv } from '../../config/env.validator';

const config = validateEnv();

export class FilesController {
  // Single file upload handler
  static async uploadSingle(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          success: false,
          message: 'Please provide a file',
          code: 400,
          data: {}
        });
      }

      const filepath = await storageService.handleSingleUpload(req.file);
      logger.info('File uploaded successfully:', {
        user: req.user?.uid,
        filepath
      });

      res.json({
        error: null,
        success: true,
        message: 'File uploaded successfully',
        code: 200,
        data: { filepath }
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'File upload failed',
        success: false,
        message: 'Failed to upload file',
        code: 500,
        data: {}
      });
    }
  }

  // Multiple files upload handler
  static async uploadMany(req: AuthRequest, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          success: false,
          message: 'Please provide at least one file',
          code: 400,
          data: {}
        });
      }

      const filepaths = await storageService.handleMultipleUploads(files);
      logger.info('Files uploaded successfully:', {
        user: req.user?.uid,
        count: files.length,
        filepaths
      });

      res.json({
        error: null,
        success: true,
        message: 'Files uploaded successfully',
        code: 200,
        data: { filepaths }
      });
    } catch (error) {
      logger.error('Error uploading files:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Files upload failed',
        success: false,
        message: 'Failed to upload files',
        code: 500,
        data: {}
      });
    }
  }

  // Delete file handler
  static async deleteFile(req: AuthRequest, res: Response) {
    try {
      const { filepath } = req.params;
      await storageService.deleteFile(decodeURIComponent(filepath));

      logger.info('File deleted successfully:', {
        user: req.user?.uid,
        filepath
      });

      res.json({
        error: null,
        success: true,
        message: 'File deleted successfully',
        code: 200,
        data: {}
      });
    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'File deletion failed',
        success: false,
        message: 'Failed to delete file',
        code: 500,
        data: {}
      });
    }
  }

  // View file by ID handler
  static async viewFile(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // For local storage
      if (config.FILE_STORAGE_TYPE === 'local') {
        const filePath = path.join(config.FILE_UPLOAD_PATH, id);
        
        try {
          await fs.access(filePath); // Check if file exists
          res.sendFile(filePath);
        } catch (error) {
          return res.status(404).json({
            error: 'File not found',
            success: false,
            message: 'The requested file does not exist',
            code: 404,
            data: {}
          });
        }
      } 
      // For S3 storage
      else {
        const s3Url = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/uploads/${id}`;
        res.redirect(s3Url);
      }
    } catch (error) {
      logger.error('Error viewing file:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to view file',
        success: false,
        message: 'Failed to view file',
        code: 500,
        data: {}
      });
    }
  }
}
