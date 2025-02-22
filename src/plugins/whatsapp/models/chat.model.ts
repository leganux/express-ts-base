import mongoose from 'mongoose';

export interface IWhatsAppChat {
  jid: string;
  name?: string;
  unreadCount: number;
  lastMessageTimestamp: number;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppChatSchema = new mongoose.Schema<IWhatsAppChat>({
  jid: { type: String, required: true, unique: true },
  name: { type: String },
  unreadCount: { type: Number, default: 0 },
  lastMessageTimestamp: { type: Number, required: true },
  isGroup: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const WhatsAppChat = mongoose.model<IWhatsAppChat>('WhatsAppChat', WhatsAppChatSchema);
