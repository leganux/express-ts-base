import { Router } from 'express';
import { validateEnv } from '../../config/env.validator';
import StripePlugin from './index';
import { raw } from 'body-parser';

const config = validateEnv();

export default function stripeRoutes() {
    const router = Router();
    const stripe = new StripePlugin(config.STRIPE_SECRET_KEY);

    // Payment Intents
    router.post('/payment-intents', async (req, res) => {
        try {
            const { amount, currency, metadata } = req.body;
            const paymentIntent = await stripe.createPaymentIntent(amount, currency, metadata);
            res.json(paymentIntent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create payment intent' });
        }
    });

    router.get('/payment-intents/:id', async (req, res) => {
        try {
            const paymentIntent = await stripe.retrievePaymentIntent(req.params.id);
            res.json(paymentIntent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve payment intent' });
        }
    });

    router.post('/payment-intents/:id/confirm', async (req, res) => {
        try {
            const { paymentMethodId } = req.body;
            const paymentIntent = await stripe.confirmPaymentIntent(req.params.id, paymentMethodId);
            res.json(paymentIntent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to confirm payment intent' });
        }
    });

    // Customers
    router.post('/customers', async (req, res) => {
        try {
            const { email, name, metadata } = req.body;
            const customer = await stripe.createCustomer(email, name, metadata);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create customer' });
        }
    });

    router.get('/customers/:id', async (req, res) => {
        try {
            const customer = await stripe.retrieveCustomer(req.params.id);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve customer' });
        }
    });

    router.patch('/customers/:id', async (req, res) => {
        try {
            const customer = await stripe.updateCustomer(req.params.id, req.body);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update customer' });
        }
    });

    // Payment Methods
    router.post('/payment-methods', async (req, res) => {
        try {
            const { type, data } = req.body;
            const paymentMethod = await stripe.createPaymentMethod(type, data);
            res.json(paymentMethod);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create payment method' });
        }
    });

    router.post('/payment-methods/:id/attach', async (req, res) => {
        try {
            const { customerId } = req.body;
            const paymentMethod = await stripe.attachPaymentMethod(req.params.id, customerId);
            res.json(paymentMethod);
        } catch (error) {
            res.status(500).json({ error: 'Failed to attach payment method' });
        }
    });

    // Subscriptions
    router.post('/subscriptions', async (req, res) => {
        try {
            const { customerId, priceId, metadata } = req.body;
            const subscription = await stripe.createSubscription(customerId, priceId, metadata);
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create subscription' });
        }
    });

    router.get('/subscriptions/:id', async (req, res) => {
        try {
            const subscription = await stripe.retrieveSubscription(req.params.id);
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve subscription' });
        }
    });

    router.delete('/subscriptions/:id', async (req, res) => {
        try {
            const subscription = await stripe.cancelSubscription(req.params.id);
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel subscription' });
        }
    });

    // Products and Prices
    router.post('/products', async (req, res) => {
        try {
            const { name, description, metadata } = req.body;
            const product = await stripe.createProduct(name, description, metadata);
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create product' });
        }
    });

    router.post('/prices', async (req, res) => {
        try {
            const { productId, unitAmount, currency, recurring } = req.body;
            const price = await stripe.createPrice(productId, unitAmount, currency, recurring);
            res.json(price);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create price' });
        }
    });

    // Refunds
    router.post('/refunds', async (req, res) => {
        try {
            const { paymentIntentId, amount } = req.body;
            const refund = await stripe.createRefund(paymentIntentId, amount);
            res.json(refund);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create refund' });
        }
    });

    // Webhooks
    router.post('/webhooks', raw({ type: 'application/json' }), async (req, res) => {
        const sig = req.headers['stripe-signature'];

        try {
            const event = stripe.constructEvent(
                req.body,
                sig as string,
                config.STRIPE_WEBHOOK_SECRET
            );

            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    // Handle successful payment
                    break;
                case 'payment_intent.payment_failed':
                    // Handle failed payment
                    break;
                case 'customer.subscription.deleted':
                    // Handle subscription cancellation
                    break;
                case 'customer.subscription.updated':
                    // Handle subscription update
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            res.status(400).json({ error: 'Webhook signature verification failed' });
        }
    });

    return router;
}
