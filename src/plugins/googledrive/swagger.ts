/**
 * @swagger
 * tags:
 *   name: Google Drive
 *   description: Google Drive file operations for Excel and Word documents
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileOperation:
 *       type: object
 *       properties:
 *         fileId:
 *           type: string
 *           description: Google Drive file ID
 *         fileName:
 *           type: string
 *           description: Original file name
 *         operation:
 *           type: string
 *           enum: [read, write]
 *           description: Type of operation performed
 *         fileType:
 *           type: string
 *           enum: [excel, word]
 *           description: Type of file
 *         status:
 *           type: string
 *           enum: [success, error]
 *           description: Operation status
 *         error:
 *           type: string
 *           description: Error message if operation failed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Operation timestamp
 */

/**
 * @swagger
 * /api/googledrive/excel/read:
 *   post:
 *     summary: Read an Excel file from Google Drive
 *     tags: [Google Drive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: Google Drive file ID
 *     responses:
 *       200:
 *         description: Excel file read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Excel rows as JSON objects
 *                     example: [
 *                       { "column1": "value1", "column2": "value2" },
 *                       { "column1": "value3", "column2": "value4" }
 *                     ]
 *       400:
 *         description: File ID is required
 *       500:
 *         description: Error reading Excel file
 */

/**
 * @swagger
 * /api/googledrive/excel/write:
 *   post:
 *     summary: Write an Excel file to Google Drive
 *     tags: [Google Drive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - data
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name for the Excel file
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of objects to write as Excel rows
 *     responses:
 *       200:
 *         description: Excel file written successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                   description: Google Drive file ID of created file
 *       400:
 *         description: File name and data array are required
 *       500:
 *         description: Error writing Excel file
 */

/**
 * @swagger
 * /api/googledrive/word/read:
 *   post:
 *     summary: Read a Word document from Google Drive
 *     tags: [Google Drive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: Google Drive file ID
 *     responses:
 *       200:
 *         description: Word document read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   description: Document content as text
 *                   example: "This is the content of the Word document..."
 *       400:
 *         description: File ID is required
 *       500:
 *         description: Error reading Word document
 */

/**
 * @swagger
 * /api/googledrive/word/write:
 *   post:
 *     summary: Write a Word document to Google Drive
 *     tags: [Google Drive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - content
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name for the Word document
 *               content:
 *                 type: string
 *                 description: Text content to write to document
 *     responses:
 *       200:
 *         description: Word document written successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                   description: Google Drive file ID of created file
 *       400:
 *         description: File name and content are required
 *       500:
 *         description: Error writing Word document
 */
