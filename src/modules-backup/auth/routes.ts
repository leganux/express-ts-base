import { Router } from 'express';
import { authController } from './controller';
import { validateFirebaseToken, roleGuard, AuthRequest } from '../../middleware/auth.middleware';
import { UserRole, setUserRole } from '../../config/firebase';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', (req, res) => {
  logger.debug('Register request:', { email: req.body.email });
  return authController.register(req, res);
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  logger.debug('Login request:', { email: req.body.email });
  return authController.login(req, res);
});

/**
 * @swagger
 * /api/v1/auth/login-with-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with Firebase ID Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID Token
 *               firstName:
 *                 type: string
 *                 description: Optional first name override
 *               lastName:
 *                 type: string
 *                 description: Optional last name override
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: null
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 code:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid token
 */
router.post('/login-with-token', (req, res) => {
  logger.debug('Login with token request');
  return authController.loginWithToken(req, res);
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       400:
 *         description: Invalid email
 */
router.post('/reset-password', (req, res) => {
  logger.debug('Password reset request:', { email: req.body.email });
  return authController.resetPassword(req, res);
});

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify authentication token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token verified
 *       401:
 *         description: Invalid token
 */
router.get('/verify', validateFirebaseToken, (req: AuthRequest, res) => {
  logger.debug('Token verification request');
  return authController.verifyToken(req, res);
});

/**
 * @swagger
 * /api/v1/auth/set-role:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Set user role (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - role
 *             properties:
 *               uid:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum:
 *                   - PUBLIC
 *                   - USER
 *                   - ADMIN
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 */
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
