import mongoose from 'mongoose';

export interface IStripePrice {
  priceId: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: string;
    intervalCount: number;
  };
  active: boolean;
  metadata: Record<string, any>;
}

export interface IStripeProduct {
  productId: string;
  name: string;
  description?: string;
  active: boolean;
  prices: IStripePrice[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StripePriceSchema = new mongoose.Schema<IStripePrice>({
  priceId: { type: String, required: true },
  productId: { type: String, required: true },
  unitAmount: { type: Number, required: true },
  currency: { type: String, required: true },
  recurring: {
    interval: String,
    intervalCount: Number
  },
  active: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const StripeProductSchema = new mongoose.Schema<IStripeProduct>({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  active: { type: Boolean, default: true },
  prices: [StripePriceSchema],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for efficient querying
StripeProductSchema.index({ active: 1 });
StripeProductSchema.index({ 'prices.priceId': 1 });

export const StripeProduct = mongoose.model<IStripeProduct>('StripeProduct', StripeProductSchema);
