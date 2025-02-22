import mongoose from 'mongoose';

export interface ICustomer {
  customerId: string;
  email: string;
  name?: string;
  phone?: string;
  defaultPaymentMethod?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OpenPayCustomerSchema = new mongoose.Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  phone: String,
  defaultPaymentMethod: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for efficient querying
OpenPayCustomerSchema.index({ email: 1 });

export const OpenPayCustomer = mongoose.model<ICustomer>('OpenPayCustomer', OpenPayCustomerSchema);
