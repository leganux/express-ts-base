import { Router, Response, NextFunction } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { upload, storageService } from '../../services/storage.service';
import { logger } from '../../utils/logger';
import multer from 'multer';

const router = Router();

// Single file upload
router.post('/single', 
  validateFirebaseToken,
  upload.single('file'),
  async (req: AuthRequest, res) => {
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
);

// Multiple files upload (max 5 files)
router.post('/many',
  validateFirebaseToken,
  upload.array('files', 5),
  async (req: AuthRequest, res) => {
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
);

// Delete file
router.delete('/:filepath',
  validateFirebaseToken,
  async (req: AuthRequest, res) => {
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
);

// Error handling middleware
router.use((error: Error, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer error:', error);
    return res.status(400).json({
      error: error.message,
      success: false,
      message: 'File upload error',
      code: 400,
      data: {}
    });
  }
  
  logger.error('Unexpected error in file routes:', error);
  return res.status(500).json({
    error: error.message || 'Unexpected error',
    success: false,
    message: 'Internal server error',
    code: 500,
    data: {}
  });
});

export default router;
