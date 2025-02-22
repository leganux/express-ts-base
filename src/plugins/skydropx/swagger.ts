/**
 * @swagger
 * tags:
 *   name: Skydropx
 *   description: Skydropx shipping operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - street1
 *         - city
 *         - province
 *         - country
 *         - zip
 *         - name
 *         - phone
 *         - email
 *         - contents
 *       properties:
 *         street1:
 *           type: string
 *         street2:
 *           type: string
 *         city:
 *           type: string
 *         province:
 *           type: string
 *         country:
 *           type: string
 *         zip:
 *           type: string
 *         name:
 *           type: string
 *         company:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         reference:
 *           type: string
 *         contents:
 *           type: string
 *     Parcel:
 *       type: object
 *       required:
 *         - weight
 *         - height
 *         - width
 *         - length
 *       properties:
 *         weight:
 *           type: number
 *         height:
 *           type: number
 *         width:
 *           type: number
 *         length:
 *           type: number
 */

/**
 * @swagger
 * /api/skydropx/shipments:
 *   post:
 *     summary: Create a new shipment
 *     tags: [Skydropx]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAddress
 *               - toAddress
 *               - parcel
 *               - consignmentNote
 *             properties:
 *               fromAddress:
 *                 $ref: '#/components/schemas/Address'
 *               toAddress:
 *                 $ref: '#/components/schemas/Address'
 *               parcel:
 *                 $ref: '#/components/schemas/Parcel'
 *               consignmentNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment created successfully
 *       500:
 *         description: Failed to create shipment
 */

/**
 * @swagger
 * /api/skydropx/shipments/{id}/rates:
 *   get:
 *     summary: Get shipping rates for a shipment
 *     tags: [Skydropx]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *       500:
 *         description: Failed to get shipping rates
 */

/**
 * @swagger
 * /api/skydropx/labels:
 *   post:
 *     summary: Create a shipping label
 *     tags: [Skydropx]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rateId
 *             properties:
 *               rateId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Label created successfully
 *       500:
 *         description: Failed to create label
 */

/**
 * @swagger
 * /api/skydropx/tracking/{number}:
 *   get:
 *     summary: Track a shipment
 *     tags: [Skydropx]
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking information retrieved successfully
 *       500:
 *         description: Failed to track shipment
 */

/**
 * @swagger
 * /api/skydropx/carriers:
 *   get:
 *     summary: Get available carriers
 *     tags: [Skydropx]
 *     responses:
 *       200:
 *         description: Carriers retrieved successfully
 *       500:
 *         description: Failed to get carriers
 */

/**
 * @swagger
 * /api/skydropx/shipments/{id}:
 *   get:
 *     summary: Get shipment details
 *     tags: [Skydropx]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipment details retrieved successfully
 *       500:
 *         description: Failed to get shipment details
 *   delete:
 *     summary: Cancel a shipment
 *     tags: [Skydropx]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipment cancelled successfully
 *       500:
 *         description: Failed to cancel shipment
 */

/**
 * @swagger
 * /api/skydropx/labels/{id}:
 *   get:
 *     summary: Get label status
 *     tags: [Skydropx]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label status retrieved successfully
 *       500:
 *         description: Failed to get label status
 */
