import mongoose from 'mongoose';
import { EnviaAddress } from '../index';

export interface IPickup {
  pickupId: string;
  address: EnviaAddress;
  carrier: string;
  date: string;
  timeWindow: string;
  shipmentIds: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: String,
  email: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  number: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  reference: String
}, { _id: false });

const PickupSchema = new mongoose.Schema<IPickup>({
  pickupId: { type: String, required: true, unique: true },
  address: { type: AddressSchema, required: true },
  carrier: { type: String, required: true },
  date: { type: String, required: true },
  timeWindow: { type: String, required: true },
  shipmentIds: { type: [String], required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, {
  timestamps: true
});

export const EnviaPickup = mongoose.model<IPickup>('EnviaPickup', PickupSchema);
