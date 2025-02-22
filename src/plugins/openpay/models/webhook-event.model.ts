import mongoose from 'mongoose';

export interface IWebhookEvent {
  eventId: string;
  type: string;
  data: Record<string, any>;
  created: Date;
  processed: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpenPayWebhookEventSchema = new mongoose.Schema<IWebhookEvent>({
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
OpenPayWebhookEventSchema.index({ type: 1, created: -1 });
OpenPayWebhookEventSchema.index({ processed: 1 });

export const OpenPayWebhookEvent = mongoose.model<IWebhookEvent>('OpenPayWebhookEvent', OpenPayWebhookEventSchema);
