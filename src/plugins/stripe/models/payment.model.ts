import mongoose from 'mongoose';

export interface IStripePayment {
  paymentIntentId: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  metadata: Record<string, any>;
  refunded: boolean;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StripePaymentSchema = new mongoose.Schema<IStripePayment>({
  paymentIntentId: { type: String, required: true, unique: true },
  customerId: String,
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true },
  paymentMethod: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  refunded: { type: Boolean, default: false },
  refundAmount: Number
}, {
  timestamps: true
});

// Index for efficient querying
StripePaymentSchema.index({ customerId: 1, createdAt: -1 });
StripePaymentSchema.index({ status: 1 });

export const StripePayment = mongoose.model<IStripePayment>('StripePayment', StripePaymentSchema);
