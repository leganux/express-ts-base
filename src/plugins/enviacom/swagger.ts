/**
 * @swagger
 * tags:
 *   name: Enviacom
 *   description: Enviacom shipping operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EnviaAddress:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - street
 *         - number
 *         - district
 *         - city
 *         - state
 *         - country
 *         - postalCode
 *       properties:
 *         name:
 *           type: string
 *         company:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         street:
 *           type: string
 *         number:
 *           type: string
 *         district:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *         postalCode:
 *           type: string
 *         reference:
 *           type: string
 *     EnviaPackage:
 *       type: object
 *       required:
 *         - content
 *         - amount
 *         - type
 *         - weight
 *         - weightUnit
 *         - lengthUnit
 *         - dimensions
 *       properties:
 *         content:
 *           type: string
 *         amount:
 *           type: number
 *         type:
 *           type: string
 *         weight:
 *           type: number
 *         insurance:
 *           type: number
 *         declaredValue:
 *           type: number
 *         weightUnit:
 *           type: string
 *           enum: [kg, lb]
 *         lengthUnit:
 *           type: string
 *           enum: [cm, in]
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 */

/**
 * @swagger
 * /api/enviacom/rates:
 *   post:
 *     summary: Get shipping rates
 *     tags: [Enviacom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - packages
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               destination:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               packages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EnviaPackage'
 *     responses:
 *       200:
 *         description: Shipping rates retrieved successfully
 *       500:
 *         description: Failed to get shipping rates
 */

/**
 * @swagger
 * /api/enviacom/shipments:
 *   post:
 *     summary: Create a shipment
 *     tags: [Enviacom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - packages
 *               - carrier
 *               - service
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               destination:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               packages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EnviaPackage'
 *               carrier:
 *                 type: string
 *               service:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment created successfully
 *       500:
 *         description: Failed to create shipment
 */

/**
 * @swagger
 * /api/enviacom/tracking/{number}:
 *   get:
 *     summary: Track a shipment
 *     tags: [Enviacom]
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
 * /api/enviacom/carriers:
 *   get:
 *     summary: Get available carriers
 *     tags: [Enviacom]
 *     responses:
 *       200:
 *         description: Carriers retrieved successfully
 *       500:
 *         description: Failed to get carriers
 */

/**
 * @swagger
 * /api/enviacom/labels/{shipmentId}:
 *   get:
 *     summary: Generate shipping label
 *     tags: [Enviacom]
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label generated successfully
 *       500:
 *         description: Failed to generate label
 */

/**
 * @swagger
 * /api/enviacom/insurance/quote:
 *   post:
 *     summary: Get insurance quote
 *     tags: [Enviacom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - declaredValue
 *               - carrier
 *             properties:
 *               declaredValue:
 *                 type: number
 *               carrier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Insurance quote retrieved successfully
 *       500:
 *         description: Failed to get insurance quote
 */

/**
 * @swagger
 * /api/enviacom/pickup/availability:
 *   post:
 *     summary: Get pickup availability
 *     tags: [Enviacom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - carrier
 *               - date
 *             properties:
 *               address:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               carrier:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Pickup availability retrieved successfully
 *       500:
 *         description: Failed to get pickup availability
 */

/**
 * @swagger
 * /api/enviacom/pickup:
 *   post:
 *     summary: Schedule a pickup
 *     tags: [Enviacom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - carrier
 *               - date
 *               - timeWindow
 *               - shipmentIds
 *             properties:
 *               address:
 *                 $ref: '#/components/schemas/EnviaAddress'
 *               carrier:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               timeWindow:
 *                 type: string
 *               shipmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Pickup scheduled successfully
 *       500:
 *         description: Failed to schedule pickup
 */

/**
 * @swagger
 * /api/enviacom/pickup/{id}:
 *   delete:
 *     summary: Cancel a pickup
 *     tags: [Enviacom]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pickup cancelled successfully
 *       500:
 *         description: Failed to cancel pickup
 */
