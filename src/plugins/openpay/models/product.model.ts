import mongoose from 'mongoose';

export interface IPrice {
  priceId: string;
  productId: string;
  amount: number;
  currency: string;
  recurring?: {
    frequency: string; // monthly, yearly, etc.
    interval: number;
  };
  active: boolean;
  metadata: Record<string, any>;
}

export interface IProduct {
  productId: string;
  name: string;
  description?: string;
  active: boolean;
  prices: IPrice[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OpenPayPriceSchema = new mongoose.Schema<IPrice>({
  priceId: { type: String, required: true },
  productId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  recurring: {
    frequency: String,
    interval: Number
  },
  active: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const OpenPayProductSchema = new mongoose.Schema<IProduct>({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  active: { type: Boolean, default: true },
  prices: [OpenPayPriceSchema],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for efficient querying
OpenPayProductSchema.index({ active: 1 });
OpenPayProductSchema.index({ 'prices.priceId': 1 });

export const OpenPayProduct = mongoose.model<IProduct>('OpenPayProduct', OpenPayProductSchema);
