import mongoose from 'mongoose';

export interface IStripeCustomer {
  customerId: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StripeCustomerSchema = new mongoose.Schema<IStripeCustomer>({
  customerId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  defaultPaymentMethod: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

export const StripeCustomer = mongoose.model<IStripeCustomer>('StripeCustomer', StripeCustomerSchema);
