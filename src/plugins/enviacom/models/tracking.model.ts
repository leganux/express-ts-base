import mongoose from 'mongoose';

export interface ITrackingUpdate {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  location?: string;
  description: string;
  timestamp: Date;
  carrier: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingUpdateSchema = new mongoose.Schema<ITrackingUpdate>({
  shipmentId: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  status: { type: String, required: true },
  location: String,
  description: { type: String, required: true },
  timestamp: { type: Date, required: true },
  carrier: { type: String, required: true }
}, {
  timestamps: true
});

// Index for efficient querying
TrackingUpdateSchema.index({ shipmentId: 1, timestamp: -1 });
TrackingUpdateSchema.index({ trackingNumber: 1, timestamp: -1 });

export const EnviaTrackingUpdate = mongoose.model<ITrackingUpdate>('EnviaTrackingUpdate', TrackingUpdateSchema);
