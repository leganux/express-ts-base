import { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { IPaymentPlugin } from '../../types/plugin';
import { logger } from '../../utils/logger';
import { MercadoPagoPayment, IPayment } from './payment.model';

class MercadoPagoPlugin implements IPaymentPlugin {
  name = 'mercadopago';
  version = '1.0.0';
  private accessToken?: string;
  private isSandbox: boolean = true;

  private cronJob?: ReturnType<typeof setInterval>;

  async initialize(app: Express, mongoose: mongoose.Mongoose): Promise<void> {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    this.isSandbox = process.env.MERCADOPAGO_SANDBOX === 'true';

    if (!this.accessToken) {
      logger.warn('MercadoPago plugin initialized without credentials. Payment processing will be unavailable.');
      return;
    }

    logger.info(`MercadoPago plugin initialized in ${this.isSandbox ? 'sandbox' : 'production'} mode`);

    // Setup webhook endpoint
    app.post('/api/v1/payments/mercadopago/webhook', this.handleWebhook.bind(this));

    // Start cron job for payment status checks
    this.startCronJob();
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;
      logger.info('Received MercadoPago webhook:', event);

      // Verify webhook authenticity (in production, you should verify the webhook signature)
      if (!event.type || !event.data) {
        throw new Error('Invalid webhook payload');
      }

      // Process the webhook event
      switch (event.type) {
        case 'payment.updated':
        case 'payment.created':
          const payment = event.data;
          const status = this.mapMercadoPagoStatus(payment.status);
          await this.updatePaymentStatus(payment.id, status, payment);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error processing MercadoPago webhook:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }

  private mapMercadoPagoStatus(mpStatus: string): IPayment['status'] {
    switch (mpStatus) {
      case 'approved':
        return 'completed';
      case 'rejected':
      case 'cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private async updatePaymentStatus(
    transactionId: string,
    status: IPayment['status'],
    metadata?: any
  ): Promise<void> {
    try {
      await MercadoPagoPayment.findOneAndUpdate(
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
        logger.info('Running MercadoPago payment status check cron job');
        
        // Find all pending payments older than 5 minutes
        const pendingPayments = await MercadoPagoPayment.find({
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
        logger.error('Error in MercadoPago cron job:', error);
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
      if (!this.accessToken) {
        throw new Error('MercadoPago credentials not configured');
      }

      // Here would go the actual MercadoPago API integration
      // This is a mock implementation
      logger.info(`Processing MercadoPago payment: ${amount} ${currency}`);
      
      const transactionId = `mp_${Date.now()}`;

      // Create payment record
      await MercadoPagoPayment.create({
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
      logger.error('MercadoPago payment processing error:', error);
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
      if (!this.accessToken) {
        throw new Error('MercadoPago credentials not configured');
      }

      // Here would go the actual MercadoPago status check
      // This is a mock implementation
      logger.info(`Checking MercadoPago payment status for: ${transactionId}`);

      return {
        status: 'completed',
        metadata: {
          transactionId,
          checkedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('MercadoPago status check error:', error);
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
    logger.info('MercadoPago plugin unloaded');
  }
}

export default MercadoPagoPlugin;
