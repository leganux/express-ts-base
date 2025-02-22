import mongoose from 'mongoose';

const codeSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['qr', 'barcode'],
        required: true
    },
    format: {
        type: String,
        default: 'base64'
    },
    barcodeType: {
        type: String,
        default: 'CODE128'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'codes'
});

// Index for efficient queries
codeSchema.index({ type: 1, createdAt: -1 });
codeSchema.index({ text: 1 });

export const Code = mongoose.model('Code', codeSchema);
