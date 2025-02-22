import mongoose from 'mongoose';
import { ShipmentAddress, ParcelDimensions } from '../index';

export interface ISkydropxShipment {
  shipmentId: string;
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  parcel: ParcelDimensions;
  consignmentNote: string;
  status: string;
  rateId?: string;
  labelId?: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new mongoose.Schema({
  street1: { type: String, required: true },
  street2: String,
  city: { type: String, required: true },
  province: { type: String, required: true },
  country: { type: String, required: true },
  zip: { type: String, required: true },
  name: { type: String, required: true },
  company: String,
  phone: { type: String, required: true },
  email: { type: String, required: true },
  reference: String,
  contents: { type: String, required: true }
}, { _id: false });

const ParcelSchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  length: { type: Number, required: true }
}, { _id: false });

const SkydropxShipmentSchema = new mongoose.Schema<ISkydropxShipment>({
  shipmentId: { type: String, required: true, unique: true },
  fromAddress: { type: AddressSchema, required: true },
  toAddress: { type: AddressSchema, required: true },
  parcel: { type: ParcelSchema, required: true },
  consignmentNote: { type: String, required: true },
  status: { type: String, required: true },
  rateId: String,
  labelId: String,
  trackingNumber: String,
  carrierName: String,
  estimatedDeliveryDate: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
SkydropxShipmentSchema.index({ status: 1 });
SkydropxShipmentSchema.index({ trackingNumber: 1 });
SkydropxShipmentSchema.index({ 'fromAddress.email': 1 });
SkydropxShipmentSchema.index({ 'toAddress.email': 1 });

export const SkydropxShipment = mongoose.model<ISkydropxShipment>('SkydropxShipment', SkydropxShipmentSchema);
