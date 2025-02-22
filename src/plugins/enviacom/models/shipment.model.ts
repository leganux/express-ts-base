import mongoose from 'mongoose';
import { EnviaAddress, EnviaPackage } from '../index';

export interface IShipment {
  shipmentId: string;
  origin: EnviaAddress;
  destination: EnviaAddress;
  packages: EnviaPackage[];
  carrier: string;
  service: string;
  status: string;
  trackingNumber?: string;
  labelUrl?: string;
  cost: number;
  currency: string;
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

const PackageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  weight: { type: Number, required: true },
  insurance: Number,
  declaredValue: Number,
  weightUnit: { type: String, enum: ['kg', 'lb'], required: true },
  lengthUnit: { type: String, enum: ['cm', 'in'], required: true },
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  }
}, { _id: false });

const ShipmentSchema = new mongoose.Schema<IShipment>({
  shipmentId: { type: String, required: true, unique: true },
  origin: { type: AddressSchema, required: true },
  destination: { type: AddressSchema, required: true },
  packages: { type: [PackageSchema], required: true },
  carrier: { type: String, required: true },
  service: { type: String, required: true },
  status: { type: String, required: true },
  trackingNumber: String,
  labelUrl: String,
  cost: { type: Number, required: true },
  currency: { type: String, required: true }
}, {
  timestamps: true
});

export const EnviaShipment = mongoose.model<IShipment>('EnviaShipment', ShipmentSchema);
