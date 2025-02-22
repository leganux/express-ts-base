import mongoose from 'mongoose';

export interface ISkydropxTracking {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  location?: string;
  description: string;
  timestamp: Date;
  carrierName: string;
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkydropxTrackingSchema = new mongoose.Schema<ISkydropxTracking>({
  shipmentId: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  status: { type: String, required: true },
  location: String,
  description: { type: String, required: true },
  timestamp: { type: Date, required: true },
  carrierName: { type: String, required: true },
  estimatedDeliveryDate: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
SkydropxTrackingSchema.index({ shipmentId: 1, timestamp: -1 });
SkydropxTrackingSchema.index({ trackingNumber: 1, timestamp: -1 });
SkydropxTrackingSchema.index({ status: 1 });

export const SkydropxTracking = mongoose.model<ISkydropxTracking>('SkydropxTracking', SkydropxTrackingSchema);
