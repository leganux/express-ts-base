import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
    order_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    facturama_id: string;
    facturama_uuid: string;
    total: number;
    subtotal: number;
    tax: number;
    status: 'active' | 'cancelled';
    pdf_url: string;
    xml_url: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const InvoiceSchema = new Schema({
    order_id: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facturama_id: {
        type: String,
        required: true,
        unique: true
    },
    facturama_uuid: {
        type: String,
        required: true,
        unique: true
    },
    total: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    },
    pdf_url: {
        type: String,
        required: true
    },
    xml_url: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
InvoiceSchema.index({ order_id: 1 });
InvoiceSchema.index({ user_id: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
