import { Router } from 'express';
import { validateEnv } from '../../config/env.validator';
import OpenPayPlugin from './index';
import { raw } from 'body-parser';

const config = validateEnv();

export default function openPayRoutes() {
    const router = Router();
    const openPay = new OpenPayPlugin();

    // Customers
    router.post('/customers', async (req, res) => {
        try {
            const { email, name, phone, metadata } = req.body;
            const customer = await openPay.createCustomer(email, name, phone, metadata);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create customer' });
        }
    });

    router.get('/customers/:id', async (req, res) => {
        try {
            const customer = await openPay.getCustomer(req.params.id);
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve customer' });
        }
    });

    router.patch('/customers/:id', async (req, res) => {
        try {
            const result = await openPay.updateCustomer(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update customer' });
        }
    });

    // Subscriptions
    router.post('/subscriptions', async (req, res) => {
        try {
            const { customerId, planId, amount, currency, metadata } = req.body;
            const subscription = await openPay.createSubscription(
                customerId,
                planId,
                amount,
                currency,
                metadata
            );
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create subscription' });
        }
    });

    router.get('/subscriptions/:id', async (req, res) => {
        try {
            const subscription = await openPay.getSubscription(req.params.id);
            res.json(subscription);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve subscription' });
        }
    });

    router.delete('/subscriptions/:id', async (req, res) => {
        try {
            const result = await openPay.cancelSubscription(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel subscription' });
        }
    });

    // Products and Prices
    router.post('/products', async (req, res) => {
        try {
            const { name, description, metadata } = req.body;
            const product = await openPay.createProduct(name, description, metadata);
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create product' });
        }
    });

    router.get('/products/:id', async (req, res) => {
        try {
            const product = await openPay.getProduct(req.params.id);
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve product' });
        }
    });

    router.get('/products', async (req, res) => {
        try {
            const active = req.query.active === 'true';
            const products = await openPay.listProducts(active);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list products' });
        }
    });

    router.patch('/products/:id', async (req, res) => {
        try {
            const result = await openPay.updateProduct(req.params.id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update product' });
        }
    });

    router.post('/prices', async (req, res) => {
        try {
            const { productId, amount, currency, recurring, metadata } = req.body;
            const price = await openPay.createPrice(
                productId,
                amount,
                currency,
                recurring,
                metadata
            );
            res.json(price);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create price' });
        }
    });

    // Payments
    router.post('/payments', async (req, res) => {
        try {
            const { amount, currency, metadata } = req.body;
            const payment = await openPay.processPayment(amount, currency, metadata);
            res.json(payment);
        } catch (error) {
            res.status(500).json({ error: 'Failed to process payment' });
        }
    });

    router.get('/payments/:id/status', async (req, res) => {
        try {
            const status = await openPay.getPaymentStatus(req.params.id);
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get payment status' });
        }
    });

    // Webhooks
    router.post('/webhooks', raw({ type: 'application/json' }), async (req, res) => {
        try {
            // The webhook handling is done in the plugin's handleWebhook method
            await openPay.handleWebhook(req, res);
        } catch (error) {
            res.status(400).json({ error: 'Webhook processing failed' });
        }
    });

    return router;
}
