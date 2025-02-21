import { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { IPaymentPlugin } from '../../types/plugin';
import { logger } from '../../utils/logger';
import { OpenPayPayment, IPayment } from './payment.model';

class OpenPayPlugin implements IPaymentPlugin {
  name = 'openpay';
  version = '1.0.0';
  private merchantId?: string;
  private privateKey?: string;
  private isSandbox: boolean = true;

  private cronJob?: ReturnType<typeof setInterval>;

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

    // Start cron job for payment status checks
    this.startCronJob();
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;
      logger.info('Received OpenPay webhook:', event);

      // Verify webhook authenticity (in production, you should verify the webhook signature)
      if (!event.type || !event.transaction) {
        throw new Error('Invalid webhook payload');
      }

      // Process the webhook event
      switch (event.type) {
        case 'charge.succeeded':
          await this.updatePaymentStatus(event.transaction.id, 'completed', event);
          break;
        case 'charge.failed':
          await this.updatePaymentStatus(event.transaction.id, 'failed', event);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
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

  async destroy(): Promise<void> {
    if (this.cronJob) {
      clearInterval(this.cronJob);
    }
    logger.info('OpenPay plugin unloaded');
  }
}

export default OpenPayPlugin;
