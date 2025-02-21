export const emailSwaggerDocs = `
/**
 * @swagger
 * /api/v1/email/send:
 *   post:
 *     tags:
 *       - email
 *     summary: POST /send
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
 * /api/v1/email/send-template:
 *   post:
 *     tags:
 *       - email
 *     summary: POST /send-template
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
 * /api/v1/email/send-with-attachment:
 *   post:
 *     tags:
 *       - email
 *     summary: POST /send-with-attachment
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