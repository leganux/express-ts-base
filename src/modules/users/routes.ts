import { Router } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { userController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: null
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firebaseUid:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [PUBLIC, USER, ADMIN]
 *                       emailVerified:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateFirebaseToken, (req: AuthRequest, res) => {
  return userController.getAll(req, res);
});

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: null
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     firebaseUid:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [PUBLIC, USER, ADMIN]
 *                     emailVerified:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/me', validateFirebaseToken, (req: AuthRequest, res) => {
  return userController.getById(req, res);
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: null
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User details retrieved successfully
 *                 code:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     firebaseUid:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [PUBLIC, USER, ADMIN]
 *                     emailVerified:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:id', validateFirebaseToken, (req: AuthRequest, res) => {
  return userController.getById(req, res);
});

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/me', validateFirebaseToken, (req: AuthRequest, res) => {
  return userController.update(req, res);
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/:id', validateFirebaseToken, (req: AuthRequest, res) => {
  return userController.delete(req, res);
});

export default router;
