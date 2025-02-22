import { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { IPaymentPlugin } from '../../types/plugin';
import { logger } from '../../utils/logger';
import { OpenPayPayment, IPayment } from './payment.model';
import { OpenPaySubscription, ISubscription } from './models/subscription.model';
import { OpenPayProduct, IProduct, IPrice } from './models/product.model';
import { OpenPayCustomer, ICustomer } from './models/customer.model';
import { OpenPayWebhookEvent } from './models/webhook-event.model';

class OpenPayPlugin implements IPaymentPlugin {
  name = 'openpay';
  version = '1.0.0';
  private merchantId?: string;
  private privateKey?: string;
  private isSandbox: boolean = true;

  private cronJob?: ReturnType<typeof setInterval>;
  private subscriptionCronJob?: ReturnType<typeof setInterval>;

  async initialize(app: Express, mongoose: mongoose.Mongoose): Promise<void> {
    this.merchantId = process.env.OPENPAY_MERCHANT_ID;
    this.privateKey = process.env.OPENPAY_PRIVATE_KEY;
    this.isSandbox = process.env.OPENPAY_SANDBOX === 'true';

    if (!this.merchantId || !this.privateKey) {
      logger.warn('OpenPay plugin initialized without credentials. Payment processing will be unavailable.');
      return;
    }

    logger.info(`OpenPay plugin initialized in ${this.isSandbox ? 'sandbox' : 'production'} mode`);

    // Setup webhook endpoint
    app.post('/api/v1/payments/openpay/webhook', this.handleWebhook.bind(this));

    // Start cron jobs for payment and subscription status checks
    this.startCronJob();
    this.startSubscriptionCronJob();
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;
      logger.info('Received OpenPay webhook:', event);

      // Verify webhook authenticity (in production, you should verify the webhook signature)
      if (!event.type || !event.transaction) {
        throw new Error('Invalid webhook payload');
      }

      // Store webhook event
      const webhookEvent = await OpenPayWebhookEvent.create({
        eventId: event.id || `opwe_${Date.now()}`,
        type: event.type,
        data: event,
        created: new Date(),
        processed: false
      });

      try {
        // Process the webhook event
        switch (event.type) {
        case 'charge.succeeded':
          await this.updatePaymentStatus(event.transaction.id, 'completed', event);
          break;
        case 'charge.failed':
          await this.updatePaymentStatus(event.transaction.id, 'failed', event);
          break;
        case 'subscription.created':
          await this.handleSubscriptionCreated(event);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

        // Mark webhook as processed
        await OpenPayWebhookEvent.findByIdAndUpdate(webhookEvent._id, {
          processed: true
        });

        res.status(200).json({ received: true });
      } catch (error) {
        // Mark webhook as failed
        await OpenPayWebhookEvent.findByIdAndUpdate(webhookEvent._id, {
          processed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    } catch (error) {
      logger.error('Error processing OpenPay webhook:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }

  private async updatePaymentStatus(
    transactionId: string,
    status: IPayment['status'],
    metadata?: any
  ): Promise<void> {
    try {
      await OpenPayPayment.findOneAndUpdate(
        { transactionId },
        { 
          status,
          ...(metadata && { metadata })
        },
        { new: true }
      );
      logger.info(`Updated payment status for ${transactionId} to ${status}`);
    } catch (error) {
      logger.error(`Error updating payment status for ${transactionId}:`, error);
    }
  }

  private startCronJob(): void {
    // Run every hour
    const HOUR_IN_MS = 60 * 60 * 1000;
    
    this.cronJob = setInterval(async () => {
      try {
        logger.info('Running OpenPay payment status check cron job');
        
        // Find all pending payments older than 5 minutes
        const pendingPayments = await OpenPayPayment.find({
          status: 'pending',
          createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
        });

        for (const payment of pendingPayments) {
          try {
            const status = await this.getPaymentStatus(payment.transactionId);
            if (status.status !== 'pending') {
              await this.updatePaymentStatus(
                payment.transactionId,
                status.status,
                status.metadata
              );
            }
          } catch (error) {
            logger.error(`Error checking payment status for ${payment.transactionId}:`, error);
          }
        }
      } catch (error) {
        logger.error('Error in OpenPay cron job:', error);
      }
    }, HOUR_IN_MS);
  }

  async processPayment(
    amount: number,
    currency: string,
    metadata: any
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API integration
      // This is a mock implementation
      logger.info(`Processing OpenPay payment: ${amount} ${currency}`);
      
      const transactionId = `op_${Date.now()}`;

      // Create payment record
      await OpenPayPayment.create({
        transactionId,
        amount,
        currency,
        status: 'pending',
        metadata
      });

      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      logger.error('OpenPay payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(transactionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    metadata?: any;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay status check
      // This is a mock implementation
      logger.info(`Checking OpenPay payment status for: ${transactionId}`);

      return {
        status: 'completed',
        metadata: {
          transactionId,
          checkedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('OpenPay status check error:', error);
      return {
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private startSubscriptionCronJob(): void {
    // Run every day
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    
    this.subscriptionCronJob = setInterval(async () => {
      try {
        logger.info('Running OpenPay subscription check cron job');
        
        // Find all active subscriptions
        const activeSubscriptions = await OpenPaySubscription.find({
          status: 'active',
          currentPeriodEnd: { $lt: new Date() }
        });

        for (const subscription of activeSubscriptions) {
          try {
            // Check subscription status and renew if needed
            await this.processSubscriptionRenewal(subscription);
          } catch (error) {
            logger.error(`Error processing subscription renewal for ${subscription.subscriptionId}:`, error);
          }
        }
      } catch (error) {
        logger.error('Error in OpenPay subscription cron job:', error);
      }
    }, DAY_IN_MS);
  }

  private async handleSubscriptionCreated(event: any): Promise<void> {
    try {
      await OpenPaySubscription.create({
        subscriptionId: event.subscription.id,
        customerId: event.subscription.customer_id,
        status: 'active',
        planId: event.subscription.plan_id,
        amount: event.subscription.amount,
        currency: event.subscription.currency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        metadata: event
      });
      logger.info(`Created subscription record for ${event.subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription created event:', error);
    }
  }

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    try {
      await OpenPaySubscription.findOneAndUpdate(
        { subscriptionId: event.subscription.id },
        {
          status: event.subscription.status,
          amount: event.subscription.amount,
          metadata: event
        }
      );
      logger.info(`Updated subscription record for ${event.subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription updated event:', error);
    }
  }

  private async handleSubscriptionCancelled(event: any): Promise<void> {
    try {
      await OpenPaySubscription.findOneAndUpdate(
        { subscriptionId: event.subscription.id },
        {
          status: 'canceled',
          canceledAt: new Date(),
          metadata: event
        }
      );
      logger.info(`Cancelled subscription record for ${event.subscription.id}`);
    } catch (error) {
      logger.error('Error handling subscription cancelled event:', error);
    }
  }

  private async processSubscriptionRenewal(subscription: ISubscription): Promise<void> {
    try {
      // Here would go the actual OpenPay subscription renewal API call
      // This is a mock implementation
      const renewalResult = {
        success: true,
        newPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      if (renewalResult.success) {
        await OpenPaySubscription.findOneAndUpdate(
          { subscriptionId: subscription.subscriptionId },
          {
            currentPeriodStart: new Date(),
            currentPeriodEnd: renewalResult.newPeriodEnd
          }
        );
        logger.info(`Renewed subscription ${subscription.subscriptionId}`);
      } else {
        await OpenPaySubscription.findOneAndUpdate(
          { subscriptionId: subscription.subscriptionId },
          { status: 'past_due' }
        );
        logger.warn(`Failed to renew subscription ${subscription.subscriptionId}`);
      }
    } catch (error) {
      logger.error(`Error processing subscription renewal: ${error}`);
      throw error;
    }
  }

  async createSubscription(
    customerId: string,
    planId: string,
    amount: number,
    currency: string = 'MXN',
    metadata: any = {}
  ): Promise<{
    success: boolean;
    subscriptionId?: string;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API subscription creation
      // This is a mock implementation
      logger.info(`Creating OpenPay subscription for customer ${customerId}`);
      
      const subscriptionId = `ops_${Date.now()}`;

      await OpenPaySubscription.create({
        subscriptionId,
        customerId,
        status: 'active',
        planId,
        amount,
        currency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        metadata
      });

      return {
        success: true,
        subscriptionId,
      };
    } catch (error) {
      logger.error('OpenPay subscription creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API subscription cancellation
      // This is a mock implementation
      logger.info(`Cancelling OpenPay subscription ${subscriptionId}`);

      await OpenPaySubscription.findOneAndUpdate(
        { subscriptionId },
        {
          status: 'canceled',
          canceledAt: new Date(),
          cancelAtPeriodEnd: true
        }
      );

      return {
        success: true
      };
    } catch (error) {
      logger.error('OpenPay subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSubscription(subscriptionId: string): Promise<ISubscription | null> {
    try {
      return await OpenPaySubscription.findOne({ subscriptionId });
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  async createProduct(
    name: string,
    description?: string,
    metadata: any = {}
  ): Promise<{
    success: boolean;
    productId?: string;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API product creation
      // This is a mock implementation
      logger.info(`Creating OpenPay product: ${name}`);
      
      const productId = `opp_${Date.now()}`;

      await OpenPayProduct.create({
        productId,
        name,
        description,
        active: true,
        prices: [],
        metadata
      });

      return {
        success: true,
        productId,
      };
    } catch (error) {
      logger.error('OpenPay product creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createPrice(
    productId: string,
    amount: number,
    currency: string = 'MXN',
    recurring?: {
      frequency: string;
      interval: number;
    },
    metadata: any = {}
  ): Promise<{
    success: boolean;
    priceId?: string;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API price creation
      // This is a mock implementation
      logger.info(`Creating OpenPay price for product ${productId}`);
      
      const priceId = `opr_${Date.now()}`;
      const price: IPrice = {
        priceId,
        productId,
        amount,
        currency,
        recurring,
        active: true,
        metadata
      };

      await OpenPayProduct.findOneAndUpdate(
        { productId },
        { $push: { prices: price } }
      );

      return {
        success: true,
        priceId,
      };
    } catch (error) {
      logger.error('OpenPay price creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getProduct(productId: string): Promise<IProduct | null> {
    try {
      return await OpenPayProduct.findOne({ productId });
    } catch (error) {
      logger.error('Error retrieving product:', error);
      throw error;
    }
  }

  async listProducts(active?: boolean): Promise<IProduct[]> {
    try {
      const query = active !== undefined ? { active } : {};
      return await OpenPayProduct.find(query);
    } catch (error) {
      logger.error('Error listing products:', error);
      throw error;
    }
  }

  async createCustomer(
    email: string,
    name?: string,
    phone?: string,
    metadata: any = {}
  ): Promise<{
    success: boolean;
    customerId?: string;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API customer creation
      // This is a mock implementation
      logger.info(`Creating OpenPay customer: ${email}`);
      
      const customerId = `opc_${Date.now()}`;

      await OpenPayCustomer.create({
        customerId,
        email,
        name,
        phone,
        metadata
      });

      return {
        success: true,
        customerId,
      };
    } catch (error) {
      logger.error('OpenPay customer creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCustomer(customerId: string): Promise<ICustomer | null> {
    try {
      return await OpenPayCustomer.findOne({ customerId });
    } catch (error) {
      logger.error('Error retrieving customer:', error);
      throw error;
    }
  }

  async updateCustomer(
    customerId: string,
    updateData: Partial<ICustomer>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API customer update
      // This is a mock implementation
      logger.info(`Updating OpenPay customer ${customerId}`);

      await OpenPayCustomer.findOneAndUpdate(
        { customerId },
        updateData,
        { new: true }
      );

      return {
        success: true
      };
    } catch (error) {
      logger.error('OpenPay customer update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateProduct(
    productId: string,
    updateData: Partial<IProduct>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.merchantId || !this.privateKey) {
        throw new Error('OpenPay credentials not configured');
      }

      // Here would go the actual OpenPay API product update
      // This is a mock implementation
      logger.info(`Updating OpenPay product ${productId}`);

      await OpenPayProduct.findOneAndUpdate(
        { productId },
        updateData,
        { new: true }
      );

      return {
        success: true
      };
    } catch (error) {
      logger.error('OpenPay product update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async destroy(): Promise<void> {
    if (this.cronJob) {
      clearInterval(this.cronJob);
    }
    if (this.subscriptionCronJob) {
      clearInterval(this.subscriptionCronJob);
    }
    logger.info('OpenPay plugin unloaded');
  }
}

export default OpenPayPlugin;
