export const usersSwaggerDocs = `
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         firebaseUid:
 *           type: string
 *           description: Firebase User ID
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         role:
 *           type: string
 *           enum: [admin, user, public]
 *           description: User's role
 *         photoURL:
 *           type: string
 *           description: User's photo URL
 *         emailVerified:
 *           type: boolean
 *           description: Email verification status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Create a new user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - name
 *               - email
 *               - role
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user, public]
 *               photoURL:
 *                 type: string
 *               emailVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Get all users with pagination (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paginate
 *         schema:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *       - in: query
 *         name: where
 *         schema:
 *           type: object
 *       - in: query
 *         name: like
 *         schema:
 *           type: object
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: object
 *       - in: query
 *         name: populate
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Get user by ID (Admin and owner)
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
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user by ID
 *     description: Update user by ID (Admin and owner)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user by ID
 *     description: Delete user by ID (Admin only)
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *
 * /api/v1/users/find-update-create:
 *   post:
 *     tags:
 *       - Users
 *     summary: Find and update or create user
 *     description: Find user by criteria and update, or create if not found (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               where:
 *                 type: object
 *               data:
 *                 $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 * /api/v1/users/find-update:
 *   put:
 *     tags:
 *       - Users
 *     summary: Find and update user
 *     description: Find user by criteria and update (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               where:
 *                 type: object
 *               data:
 *                 $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *
 * /api/v1/users/where/first:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get first user by criteria
 *     description: Get first user matching the where criteria (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: where
 *         schema:
 *           type: object
 *       - in: query
 *         name: like
 *         schema:
 *           type: object
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: object
 *       - in: query
 *         name: populate
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *
 * /api/v1/users/firebase/{firebaseUid}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by Firebase UID
 *     description: Get user by Firebase UID (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *
 * /api/v1/users/{id}/last-login:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user's last login
 *     description: Update user's last login timestamp
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
 *         description: Last login updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *
 * /api/v1/users/{id}/email-verification:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update email verification status
 *     description: Update user's email verification status (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailVerified
 *             properties:
 *               emailVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email verification status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 *
 * /api/v1/users/{id}/role:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user role
 *     description: Update user's role (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, public]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           description: Error details if any
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         code:
 *           type: number
 *           description: HTTP status code
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/User'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             - type: object
 *           description: Response data
 */`;
