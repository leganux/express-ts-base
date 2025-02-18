import { Router } from 'express';
import { validateFirebaseToken, roleGuard, AuthRequest } from '../../middleware/auth.middleware';
import { UserRole } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { UserModel } from './model';

const router = Router();

// Get all users (Admin only)
router.get('/', 
  validateFirebaseToken,
  roleGuard([UserRole.ADMIN]),
  async (_req, res) => {
    try {
      const users = await UserModel.find().select('-__v');
      res.json({
        error: null,
        success: true,
        message: 'Users retrieved successfully',
        code: 200,
        data: users
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get users',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

// Get current user profile
router.get('/me', 
  validateFirebaseToken,
  (req: AuthRequest, res) => {
    try {
      res.json({
        error: null,
        success: true,
        message: 'Profile retrieved successfully',
        code: 200,
        data: req.user?.dbUser
      });
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get profile',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

// Get user by ID (Admin only)
router.get('/:id',
  validateFirebaseToken,
  roleGuard([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.params.id).select('-__v');
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      res.json({
        error: null,
        success: true,
        message: 'User retrieved successfully',
        code: 200,
        data: user
      });
    } catch (error) {
      logger.error('Error getting user:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get user',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

// Update current user profile
router.put('/me',
  validateFirebaseToken,
  async (req: AuthRequest, res) => {
    try {
      const updates = {
        name: req.body.name,
        photoURL: req.body.photoURL
      };

      const user = await UserModel.findOneAndUpdate(
        { firebaseUid: req.user?.uid },
        { $set: updates },
        { new: true }
      ).select('-__v');

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      res.json({
        error: null,
        success: true,
        message: 'Profile updated successfully',
        code: 200,
        data: user
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update profile',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

// Delete user (Admin only)
router.delete('/:id',
  validateFirebaseToken,
  roleGuard([UserRole.ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      // Don't allow deleting yourself
      if (user.firebaseUid === req.user?.uid) {
        return res.status(400).json({
          error: 'Cannot delete yourself',
          success: false,
          message: 'Cannot delete your own account',
          code: 400,
          data: {}
        });
      }

      await user.deleteOne();
      logger.info('User deleted:', { deletedId: req.params.id, deletedBy: req.user?.uid });

      res.json({
        error: null,
        success: true,
        message: 'User deleted successfully',
        code: 200,
        data: {}
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete user',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

export default router;
