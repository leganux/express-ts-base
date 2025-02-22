/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp messaging operations
 */

/**
 * @swagger
 * /api/whatsapp/qr:
 *   get:
 *     summary: Get WhatsApp QR code as HTML page
 *     tags: [WhatsApp]
 *     responses:
 *       200:
 *         description: HTML page with QR code for WhatsApp Web authentication
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Error generating QR code
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 * 
 * /api/whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     tags: [WhatsApp]
 *     responses:
 *       200:
 *         description: WhatsApp is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: WhatsApp is disconnected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: disconnected
 */

/**
 * @swagger
 * /api/whatsapp/chats:
 *   get:
 *     summary: Get all WhatsApp chats
 *     tags: [WhatsApp]
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   unreadCount:
 *                     type: number
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/whatsapp/messages/{jid}:
 *   get:
 *     summary: Get messages from a specific chat
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: path
 *         name: jid
 *         required: true
 *         schema:
 *           type: string
 *         description: WhatsApp ID of the chat
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   timestamp:
 *                     type: number
 *                   from:
 *                     type: string
 *                   mediaUrl:
 *                     type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/whatsapp/send:
 *   post:
 *     summary: Send a WhatsApp message
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - content
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient's WhatsApp ID (phone_number@s.whatsapp.net)
 *               content:
 *                 type: string
 *                 description: Message content or media caption
 *               type:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *                 default: text
 *                 description: Type of message
 *               mediaPath:
 *                 type: string
 *                 description: URL of media file (required for media messages)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
