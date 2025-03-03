import { Schema, model, Document } from 'mongoose';

export interface IWhatsAppFile extends Document {
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppFileSchema = new Schema({
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
}, {
    timestamps: true
});

export const WhatsAppFileModel = model<IWhatsAppFile>('WhatsAppFile', WhatsAppFileSchema);
