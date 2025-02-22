import mongoose from 'mongoose';

export interface IStripeSubscription {
  subscriptionId: string;
  customerId: string;
  status: string;
  priceId: string;
  productId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StripeSubscriptionSchema = new mongoose.Schema<IStripeSubscription>({
  subscriptionId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  status: { type: String, required: true },
  priceId: { type: String, required: true },
  productId: { type: String, required: true },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  canceledAt: Date,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for efficient querying
StripeSubscriptionSchema.index({ customerId: 1, status: 1 });
StripeSubscriptionSchema.index({ productId: 1 });
StripeSubscriptionSchema.index({ currentPeriodEnd: 1 });

export const StripeSubscription = mongoose.model<IStripeSubscription>('StripeSubscription', StripeSubscriptionSchema);
