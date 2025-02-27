import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string,
  price: number,
  description: string,
  image: string,
  category: mongoose.Types.ObjectId | string,
  stock: number,
  rating: number,
  numReviews: number,
  countInStock: number,
  brand: mongoose.Types.ObjectId | string,
  type: string,
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, 'name is required'],
  },
  price: {
    type: Number,
    required: [true, 'price is required'],
  },
  description: {
    type: String,
    required: [true, 'description is required'],
  },
  image: {
    type: String,
    required: [true, 'image is required'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'category',
  },
  stock: {
    type: Number,
    required: [true, 'stock is required'],
  },
  rating: {
    type: Number,
    required: [true, 'rating is required'],
  },
  numReviews: {
    type: Number,
    required: [true, 'numReviews is required'],
  },
  countInStock: {
    type: Number,
    required: [true, 'countInStock is required'],
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'brand',
  },
  type: {
    type: String,
    enum: ["type3"],
  },
  active: {
    type: Boolean,
    required: [true, 'active is required'],
  },
}, {
  timestamps: true
});

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
