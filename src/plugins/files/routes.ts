import { Router, Response } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';
import { Express } from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * @swagger
 * /api/v1/files/upload:
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
router.post('/upload',
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
 * /api/v1/files/upload-many:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload multiple files
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
router.post('/upload-many',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    const storageService = (req.app as Express).locals.storageService;
    
    storageService.upload.array('files')(req, res, async (err: any) => {
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
 * /api/v1/files/{filepath}:
 *   delete:
 *     tags:
 *       - Files
 *     summary: Delete a file
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filepath
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.delete('/:filepath',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { filepath } = req.params;
      const storageService = (req.app as Express).locals.storageService;
      
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
);

/**
 * @swagger
 * /api/v1/files/view/{id}:
 *   get:
 *     tags:
 *       - Files
 *     summary: View a file
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
 *         description: File retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.get('/view/:id',
  validateFirebaseToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const storageService = (req.app as Express).locals.storageService;
      
      if (storageService.getStorageType() === 'local') {
        const filePath = path.join(process.env.FILE_UPLOAD_PATH!, id);
        
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
      } else {
        const { bucket, region } = storageService.getS3Config();
        const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/uploads/${id}`;
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
);

export default router;
