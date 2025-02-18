import { Router } from 'express';
import { authController } from './controller';
import { validateFirebaseToken, roleGuard, AuthRequest } from '../../middleware/auth.middleware';
import { UserRole, setUserRole } from '../../config/firebase';
import { logger } from '../../utils/logger';

const router = Router();

// Public routes
router.post('/register', (req, res) => {
  logger.debug('Register request:', { email: req.body.email });
  return authController.register(req, res);
});

router.post('/login', (req, res) => {
  logger.debug('Login request:', { email: req.body.email });
  return authController.login(req, res);
});

router.post('/reset-password', (req, res) => {
  logger.debug('Password reset request:', { email: req.body.email });
  return authController.resetPassword(req, res);
});

// Protected routes
router.get('/verify', validateFirebaseToken, (req: AuthRequest, res) => {
  logger.debug('Token verification request');
  return authController.verifyToken(req, res);
});

// Admin only routes
router.post('/set-role', 
  validateFirebaseToken, 
  roleGuard([UserRole.ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { uid, role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          success: false,
          message: 'Role must be one of: ' + Object.values(UserRole).join(', '),
          code: 400,
          data: {}
        });
      }

      await setUserRole(uid, role);
      logger.info('User role updated:', { uid, role, updatedBy: req.user?.uid });

      res.json({
        error: null,
        success: true,
        message: 'User role updated successfully',
        code: 200,
        data: { uid, role }
      });
    } catch (error) {
      logger.error('Set role error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to set role',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

export default router;
