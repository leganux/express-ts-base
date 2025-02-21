export const filesSwaggerDocs = `
/**
 * @swagger
 * /api/v1/files/single:
 *   post:
 *     tags:
 *       - files
 *     summary: POST /single
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
 * /api/v1/files/many:
 *   post:
 *     tags:
 *       - files
 *     summary: POST /many
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
 * /api/v1/files/:filepath:
 *   delete:
 *     tags:
 *       - files
 *     summary: DELETE /:filepath
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
 * /api/v1/files/view/:id:
 *   get:
 *     tags:
 *       - files
 *     summary: GET /view/:id
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