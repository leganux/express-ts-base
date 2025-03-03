import mongoose from 'mongoose';

export interface IWhatsAppMessage {
  messageId: string;
  from: string;
  to?: string;
  type: string;
  content: string;
  mediaUrl?: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new mongoose.Schema<IWhatsAppMessage>({
  messageId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String },
  type: { type: String, required: true },
  content: { type: String, default: '' },
  mediaUrl: { type: String },
  timestamp: { type: Number, required: true },
}, {
  timestamps: true,
});

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
