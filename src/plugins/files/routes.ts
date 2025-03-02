import { Router, Response } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';
import { Express } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import axios from 'axios';
import { FileModel, IFile } from './models/file.model';

const router = Router();

/**
 * @swagger
 * /files/single:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload a single file
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/single',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    const storageService = (req.app as Express).locals.storageService;

    storageService.upload.single('file')(req, res, async (err: any) => {
      if (err) {
        logger.error('Error in file upload middleware:', err);
        return res.status(400).json({
          error: err.message,
          success: false,
          message: 'File upload failed',
          code: 400,
          data: {}
        });
      }

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
    });
  }
);

/**
 * @swagger
 * /files/multi:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload multiple files (up to 10)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/multi',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    const storageService = (req.app as Express).locals.storageService;

    storageService.upload.array('files', 10)(req, res, async (err: any) => {
      if (err) {
        logger.error('Error in file upload middleware:', err);
        return res.status(400).json({
          error: err.message,
          success: false,
          message: 'File upload failed',
          code: 400,
          data: {}
        });
      }

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
    });
  }
);

/**
 * @swagger
 * /files/list:
 *   get:
 *     tags:
 *       - Files
 *     summary: List all files
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/list',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const files = await FileModel.find().sort({ createdAt: -1 });
      res.json({
        error: null,
        success: true,
        message: 'Files listed successfully',
        code: 200,
        data: files
      });
    } catch (error) {
      logger.error('Error listing files:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list files',
        success: false,
        message: 'Failed to list files',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /files/view/{id}:
 *   get:
 *     tags:
 *       - Files
 *     summary: View/download a file
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File streamed successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Error streaming file
 */
router.get('/view/:id',
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const file = await FileModel.findById(id);
      const storageService = (req.app as Express).locals.storageService;

      if (!file) {
        return res.status(404).json({
          error: 'File not found',
          success: false,
          message: 'The requested file does not exist',
          code: 404,
          data: {}
        });
      }

      try {
        if (storageService.getStorageType() === 'local') {
          res.setHeader('Content-Type', file.mimeType);
          res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
          const fileStream = createReadStream(file.path);
          fileStream.on('error', (error) => {
            logger.error('Error reading file stream:', error);
            res.status(500).json({
              error: 'Failed to read file',
              success: false,
              message: 'Failed to read file from storage',
              code: 500,
              data: {}
            });
          });
          fileStream.pipe(res);
        } else {
          // For S3, download the file and stream it
          const signedUrl = await storageService.getFileUrl(file.path);
          const response = await axios.get(signedUrl, { 
            responseType: 'stream',
            validateStatus: function (status) {
              return status >= 200 && status < 300;
            }
          });
          res.setHeader('Content-Type', file.mimeType);
          res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
          response.data.pipe(res);
        }
      } catch (streamError) {
        logger.error('Error streaming file:', streamError);
        res.status(500).json({
          error: 'Failed to stream file',
          success: false,
          message: 'Failed to stream file from storage',
          code: 500,
          data: {}
        });
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
);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     tags:
 *       - Files
 *     summary: Get file details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File details retrieved successfully
 *       404:
 *         description: File not found
 */
router.get('/:id',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const file = await FileModel.findById(id);

      if (!file) {
        return res.status(404).json({
          error: 'File not found',
          success: false,
          message: 'The requested file does not exist',
          code: 404,
          data: {}
        });
      }

      res.json({
        error: null,
        success: true,
        message: 'File details retrieved successfully',
        code: 200,
        data: file
      });
    } catch (error) {
      logger.error('Error getting file details:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get file details',
        success: false,
        message: 'Failed to get file details',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     tags:
 *       - Files
 *     summary: Delete a file
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete('/:id',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const storageService = (req.app as Express).locals.storageService;

      await storageService.deleteFile(id);

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
);

export default router;
