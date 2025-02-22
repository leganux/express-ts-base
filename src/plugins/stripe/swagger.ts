/**
 * @swagger
 * tags:
 *   name: Stripe
 *   description: Stripe payment operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *         client_secret:
 *           type: string
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customer:
 *           type: string
 *         status:
 *           type: string
 *         current_period_end:
 *           type: number
 */

/**
 * @swagger
 * /api/stripe/payment-intents:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Stripe]
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
 *                 default: usd
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntent'
 */

/**
 * @swagger
 * /api/stripe/payment-intents/{id}:
 *   get:
 *     summary: Retrieve a payment intent
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment intent retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntent'
 */

/**
 * @swagger
 * /api/stripe/payment-intents/{id}/confirm:
 *   post:
 *     summary: Confirm a payment intent
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment intent confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntent'
 */

/**
 * @swagger
 * /api/stripe/customers:
 *   post:
 *     summary: Create a customer
 *     tags: [Stripe]
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
 * /api/stripe/subscriptions:
 *   post:
 *     summary: Create a subscription
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - priceId
 *             properties:
 *               customerId:
 *                 type: string
 *               priceId:
 *                 type: string
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
 * /api/stripe/webhooks:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Stripe]
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
