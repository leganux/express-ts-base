/**
 * @swagger
 * tags:
 *   name: QR/Barcode
 *   description: QR code and barcode generation operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Code:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           description: Text encoded in the code
 *         type:
 *           type: string
 *           enum: [qr, barcode]
 *           description: Type of code generated
 *         format:
 *           type: string
 *           description: Image format (base64)
 *         barcodeType:
 *           type: string
 *           description: Type of barcode (CODE128)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Generation timestamp
 */

/**
 * @swagger
 * /api/qrbarcode/qr:
 *   post:
 *     summary: Generate a QR code
 *     tags: [QR/Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to encode in QR code
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                   example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       400:
 *         description: Text is required
 *       500:
 *         description: Error generating QR code
 */

/**
 * @swagger
 * /api/qrbarcode/barcode:
 *   post:
 *     summary: Generate a barcode
 *     tags: [QR/Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to encode in barcode
 *     responses:
 *       200:
 *         description: Barcode generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: Base64 encoded barcode image
 *                   example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *       400:
 *         description: Text is required
 *       500:
 *         description: Error generating barcode
 */
