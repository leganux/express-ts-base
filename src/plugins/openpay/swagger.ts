/**
 * @swagger
 * tags:
 *   name: OpenPay
 *   description: OpenPay payment and subscription operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         transactionId:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *     Customer:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *     Subscription:
 *       type: object
 *       properties:
 *         subscriptionId:
 *           type: string
 *         customerId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, canceled, past_due, pending]
 *         planId:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         currentPeriodEnd:
 *           type: string
 *           format: date-time
 *     Product:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         active:
 *           type: boolean
 *         prices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Price'
 *     Price:
 *       type: object
 *       properties:
 *         priceId:
 *           type: string
 *         productId:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         recurring:
 *           type: object
 *           properties:
 *             frequency:
 *               type: string
 *             interval:
 *               type: number
 */

/**
 * @swagger
 * /api/openpay/payments:
 *   post:
 *     summary: Process a payment
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: MXN
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactionId:
 *                   type: string
 */

/**
 * @swagger
 * /api/openpay/customers:
 *   post:
 *     summary: Create a customer
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Customer created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/openpay/subscriptions:
 *   post:
 *     summary: Create a subscription
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - planId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *               planId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: MXN
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 */

/**
 * @swagger
 * /api/openpay/products:
 *   post:
 *     summary: Create a product
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/openpay/prices:
 *   post:
 *     summary: Create a price
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - amount
 *             properties:
 *               productId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: MXN
 *               recurring:
 *                 type: object
 *                 properties:
 *                   frequency:
 *                     type: string
 *                   interval:
 *                     type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Price created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Price'
 */

/**
 * @swagger
 * /api/openpay/webhooks:
 *   post:
 *     summary: Handle OpenPay webhooks
 *     tags: [OpenPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 */
