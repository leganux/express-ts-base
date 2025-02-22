import Stripe from 'stripe';
import { logger } from '../../utils/logger';
import { StripeCustomer } from './models/customer.model';
import { StripePayment } from './models/payment.model';
import { StripeSubscription } from './models/subscription.model';
import { StripeProduct } from './models/product.model';
import { StripeWebhookEvent } from './models/webhook-event.model';

import { Express } from 'express';
import { IPlugin } from '../../types/plugin';

export class StripePlugin implements IPlugin {
    private stripe!: Stripe;
    
    name = 'stripe';
    version = '1.0.0';

    constructor(private apiKey?: string) {
        if (apiKey) {
            this.initializeStripe(apiKey);
        }
    }

    private initializeStripe(apiKey: string) {
        this.stripe = new Stripe(apiKey, {
            apiVersion: '2025-01-27.acacia',
        });
    }

    async initialize(app: Express): Promise<void> {
        if (!this.apiKey) {
            throw new Error('API key is required for Stripe plugin');
        }
        this.initializeStripe(this.apiKey);
        logger.info('Stripe plugin initialized successfully');
    }

    // Payment Methods
    async createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount,
                currency,
                metadata,
            });

            // Store payment intent in database
            await StripePayment.create({
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                metadata: paymentIntent.metadata
            });

            return paymentIntent;
        } catch (error) {
            logger.error('Error creating payment intent:', error);
            throw error;
        }
    }

    async retrievePaymentIntent(paymentIntentId: string) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
            logger.error('Error retrieving payment intent:', error);
            throw error;
        }
    }

    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
        try {
            return await this.stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });
        } catch (error) {
            logger.error('Error confirming payment intent:', error);
            throw error;
        }
    }

    // Customers
    async createCustomer(email: string, name?: string, metadata: any = {}) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata,
            });

            // Store customer in database
            await StripeCustomer.create({
                customerId: customer.id,
                email: customer.email,
                name: customer.name,
                metadata: customer.metadata
            });

            return customer;
        } catch (error) {
            logger.error('Error creating customer:', error);
            throw error;
        }
    }

    async retrieveCustomer(customerId: string) {
        try {
            return await this.stripe.customers.retrieve(customerId);
        } catch (error) {
            logger.error('Error retrieving customer:', error);
            throw error;
        }
    }

    async updateCustomer(customerId: string, updateData: Stripe.CustomerUpdateParams) {
        try {
            return await this.stripe.customers.update(customerId, updateData);
        } catch (error) {
            logger.error('Error updating customer:', error);
            throw error;
        }
    }

    // Payment Methods
    async createPaymentMethod(type: Stripe.PaymentMethodCreateParams.Type, data: any) {
        try {
            return await this.stripe.paymentMethods.create({
                type,
                ...data,
            });
        } catch (error) {
            logger.error('Error creating payment method:', error);
            throw error;
        }
    }

    async attachPaymentMethod(paymentMethodId: string, customerId: string) {
        try {
            return await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
        } catch (error) {
            logger.error('Error attaching payment method:', error);
            throw error;
        }
    }

    // Subscriptions
    async createSubscription(customerId: string, priceId: string, metadata: any = {}) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                metadata,
            });

            // Get product ID from price
            const price = await this.stripe.prices.retrieve(priceId);

            // Store subscription in database
            await StripeSubscription.create({
                subscriptionId: subscription.id,
                customerId: subscription.customer as string,
                status: subscription.status,
                priceId: priceId,
                productId: price.product as string,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                metadata: subscription.metadata
            });

            return subscription;
        } catch (error) {
            logger.error('Error creating subscription:', error);
            throw error;
        }
    }

    async retrieveSubscription(subscriptionId: string) {
        try {
            return await this.stripe.subscriptions.retrieve(subscriptionId);
        } catch (error) {
            logger.error('Error retrieving subscription:', error);
            throw error;
        }
    }

    async cancelSubscription(subscriptionId: string) {
        try {
            return await this.stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            logger.error('Error canceling subscription:', error);
            throw error;
        }
    }

    // Products and Prices
    async createProduct(name: string, description?: string, metadata: any = {}) {
        try {
            const product = await this.stripe.products.create({
                name,
                description,
                metadata,
            });

            // Store product in database
            await StripeProduct.create({
                productId: product.id,
                name: product.name,
                description: product.description,
                active: product.active,
                prices: [],
                metadata: product.metadata
            });

            return product;
        } catch (error) {
            logger.error('Error creating product:', error);
            throw error;
        }
    }

    async createPrice(productId: string, unitAmount: number, currency: string = 'usd', recurring?: Stripe.PriceCreateParams.Recurring) {
        try {
            return await this.stripe.prices.create({
                product: productId,
                unit_amount: unitAmount,
                currency,
                ...(recurring && { recurring }),
            });
        } catch (error) {
            logger.error('Error creating price:', error);
            throw error;
        }
    }

    // Refunds
    async createRefund(paymentIntentId: string, amount?: number) {
        try {
            return await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                ...(amount && { amount }),
            });
        } catch (error) {
            logger.error('Error creating refund:', error);
            throw error;
        }
    }

    // Webhooks
    constructEvent(payload: string | Buffer, signature: string, webhookSecret: string) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );

            // Store webhook event in database
            StripeWebhookEvent.create({
                eventId: event.id,
                type: event.type,
                data: event.data.object,
                created: new Date(event.created * 1000),
                processed: false
            }).catch(error => {
                logger.error('Error storing webhook event:', error);
            });

            return event;
        } catch (error) {
            logger.error('Error constructing webhook event:', error);
            throw error;
        }
    }
}

export default StripePlugin;
