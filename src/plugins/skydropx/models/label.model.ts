import mongoose from 'mongoose';

export interface ISkydropxLabel {
  labelId: string;
  shipmentId: string;
  rateId: string;
  format: string;
  status: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SkydropxLabelSchema = new mongoose.Schema<ISkydropxLabel>({
  labelId: { type: String, required: true, unique: true },
  shipmentId: { type: String, required: true },
  rateId: { type: String, required: true },
  format: { type: String, required: true },
  status: { type: String, required: true },
  url: String
}, {
  timestamps: true
});

// Indexes for efficient querying
SkydropxLabelSchema.index({ shipmentId: 1 });
SkydropxLabelSchema.index({ status: 1 });

export const SkydropxLabel = mongoose.model<ISkydropxLabel>('SkydropxLabel', SkydropxLabelSchema);
