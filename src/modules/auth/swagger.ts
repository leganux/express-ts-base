export const authSwaggerDocs = `
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - auth
 *     summary: POST /register
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": null,
                 "success": true,
                 "message": "Operation successful",
                 "code": 200,
                 "data": {}
               }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": "Operation failed",
                 "success": false,
                 "message": "Operation failed",
                 "code": 400,
                 "data": {}
               }
 */
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - auth
 *     summary: POST /login
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": null,
                 "success": true,
                 "message": "Operation successful",
                 "code": 200,
                 "data": {}
               }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": "Operation failed",
                 "success": false,
                 "message": "Operation failed",
                 "code": 400,
                 "data": {}
               }
 */
/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags:
 *       - auth
 *     summary: POST /reset-password
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": null,
                 "success": true,
                 "message": "Operation successful",
                 "code": 200,
                 "data": {}
               }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": "Operation failed",
                 "success": false,
                 "message": "Operation failed",
                 "code": 400,
                 "data": {}
               }
 */
/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     tags:
 *       - auth
 *     summary: GET /verify
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": null,
                 "success": true,
                 "message": "Operation successful",
                 "code": 200,
                 "data": {}
               }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": "Operation failed",
                 "success": false,
                 "message": "Operation failed",
                 "code": 400,
                 "data": {}
               }
 */
/**
 * @swagger
 * /api/v1/auth/set-role:
 *   post:
 *     tags:
 *       - auth
 *     summary: POST /set-role
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": null,
                 "success": true,
                 "message": "Operation successful",
                 "code": 200,
                 "data": {}
               }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
                 "error": "Operation failed",
                 "success": false,
                 "message": "Operation failed",
                 "code": 400,
                 "data": {}
               }
 */`;
