import mongoose from 'mongoose';

export interface IFile {
  originalName: string;
  fileName: string;
  extension: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new mongoose.Schema<IFile>({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  extension: { type: String, required: true },
  path: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
}, {
  timestamps: true
});

export const FileModel = mongoose.model<IFile>('File', fileSchema);
