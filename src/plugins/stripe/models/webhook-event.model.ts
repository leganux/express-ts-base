import mongoose from 'mongoose';

export interface IStripeWebhookEvent {
  eventId: string;
  type: string;
  data: Record<string, any>;
  created: Date;
  processed: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripeWebhookEventSchema = new mongoose.Schema<IStripeWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  created: { type: Date, required: true },
  processed: { type: Boolean, default: false },
  error: String
}, {
  timestamps: true
});

// Indexes for efficient querying
StripeWebhookEventSchema.index({ type: 1, created: -1 });
StripeWebhookEventSchema.index({ processed: 1 });

export const StripeWebhookEvent = mongoose.model<IStripeWebhookEvent>('StripeWebhookEvent', StripeWebhookEventSchema);
