import mongoose from 'mongoose';

export interface ISubscription {
  subscriptionId: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'pending';
  planId: string;
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OpenPaySubscriptionSchema = new mongoose.Schema<ISubscription>({
  subscriptionId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  status: { type: String, required: true },
  planId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  canceledAt: Date,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for efficient querying
OpenPaySubscriptionSchema.index({ customerId: 1, status: 1 });
OpenPaySubscriptionSchema.index({ planId: 1 });
OpenPaySubscriptionSchema.index({ currentPeriodEnd: 1 });

export const OpenPaySubscription = mongoose.model<ISubscription>('OpenPaySubscription', OpenPaySubscriptionSchema);
