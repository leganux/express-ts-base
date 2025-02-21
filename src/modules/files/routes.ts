import { Router } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import multer from 'multer';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { logger } from '../../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/v1/files/single:
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
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/SuccessfulSingleUpload'
 *       400:
 *         description: Invalid file type or no file provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/ErrorInvalidFileType'
 */
router.post('/single',
  validateFirebaseToken,
  upload.single('file'),
  (req: AuthRequest, res) => {
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

      logger.info('File uploaded:', {
        user: req.user?.uid,
        filename: req.file.filename,
        size: req.file.size
      });

      res.json({
        error: null,
        success: true,
        message: 'File uploaded successfully',
        code: 200,
        data: {
          filepath: req.file.path
        }
      });
    } catch (error) {
      logger.error('Error uploading file:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload file',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/many:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload multiple files (max 5)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/SuccessfulMultipleUpload'
 *       400:
 *         description: Invalid file type or no files provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/ErrorInvalidFileType'
 */
router.post('/many',
  validateFirebaseToken,
  upload.array('files', 5),
  (req: AuthRequest, res) => {
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

      logger.info('Files uploaded:', {
        user: req.user?.uid,
        count: files.length,
        sizes: files.map(f => f.size)
      });

      res.json({
        error: null,
        success: true,
        message: 'Files uploaded successfully',
        code: 200,
        data: {
          filepaths: files.map(f => f.path)
        }
      });
    } catch (error) {
      logger.error('Error uploading files:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload files',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/files/{filepath}:
 *   delete:
 *     tags:
 *       - Files
 *     summary: Delete a file by filepath
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filepath
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/SuccessfulDelete'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/ErrorFileNotFound'
 */
router.delete('/:filepath',
  validateFirebaseToken,
  (req: AuthRequest, res) => {
    try {
      const filepath = join('uploads', req.params.filepath);

      if (!existsSync(filepath)) {
        return res.status(404).json({
          error: 'File not found',
          success: false,
          message: 'The requested file does not exist',
          code: 404,
          data: {}
        });
      }

      unlinkSync(filepath);

      logger.info('File deleted:', {
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
        error: error instanceof Error ? error.message : 'Failed to delete file',
        success: false,
        message: 'Internal server error',
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
 *     summary: View a file by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the file to view
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/examples/ErrorFileNotFound'
 */
router.get('/view/:id',
  validateFirebaseToken,
  (req: AuthRequest, res) => {
    try {
      const filepath = join('uploads', req.params.id);

      if (!existsSync(filepath)) {
        return res.status(404).json({
          error: 'File not found',
          success: false,
          message: 'The requested file does not exist',
          code: 404,
          data: {}
        });
      }

      logger.info('File viewed:', {
        user: req.user?.uid,
        filepath
      });

      // Set Content-Disposition to inline to display in browser
      res.setHeader('Content-Disposition', `inline; filename="${req.params.id}"`);
      res.sendFile(filepath, { root: '.' });
    } catch (error) {
      logger.error('Error viewing file:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to view file',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

export default router;
