import { Express } from 'express';
import mongoose from 'mongoose';

export interface IPluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface IPlugin {
  name: string;
  version: string;
  initialize: (app: Express, mongoose: mongoose.Mongoose) => Promise<void>;
  destroy?: () => Promise<void>;
}

export interface IPaymentPlugin extends IPlugin {
  processPayment: (amount: number, currency: string, metadata: any) => Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }>;
  getPaymentStatus: (transactionId: string) => Promise<{
    status: 'pending' | 'completed' | 'failed';
    metadata?: any;
  }>;
}
