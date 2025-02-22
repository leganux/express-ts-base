export const usersSwaggerDocs = `
/**
 * @swagger
 * /api/v1/users/:
 *   get:
 *     tags:
 *       - users
 *     summary: GET /
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
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - users
 *     summary: GET /me
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
 * /api/v1/users/:id:
 *   get:
 *     tags:
 *       - users
 *     summary: GET /:id
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
 * /api/v1/users/me:
 *   put:
 *     tags:
 *       - users
 *     summary: PUT /me
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
 * /api/v1/users/:id:
 *   delete:
 *     tags:
 *       - users
 *     summary: DELETE /:id
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
