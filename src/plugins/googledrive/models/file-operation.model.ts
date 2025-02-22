import mongoose from 'mongoose';

const fileOperationSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        trim: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    operation: {
        type: String,
        enum: ['read', 'write'],
        required: true
    },
    fileType: {
        type: String,
        enum: ['excel', 'word'],
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'error'],
        required: true
    },
    error: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'file_operations'
});

// Indexes for efficient queries
fileOperationSchema.index({ fileId: 1 });
fileOperationSchema.index({ operation: 1, fileType: 1 });
fileOperationSchema.index({ status: 1, createdAt: -1 });

export const FileOperation = mongoose.model('FileOperation', fileOperationSchema);
