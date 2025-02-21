import mongoose from 'mongoose';

export interface IPayment {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'openpay';
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>({
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  provider: { type: String, required: true, default: 'openpay' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
});

export const OpenPayPayment = mongoose.model<IPayment>('OpenPayPayment', PaymentSchema);
