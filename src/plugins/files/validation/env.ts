import { z } from 'zod';
import path from 'path';

export const filesEnvSchema = z.object({
  MONGODB_URI: z.string().default('mongodb://localhost:27017/express-ts-base'),
  FILE_STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  FILE_UPLOAD_PATH: z.string().optional().transform((val, ctx) => {
    const storageType = ctx.path.includes('FILE_STORAGE_TYPE') ? val : 'local';
    if (storageType === 's3') {
      // For S3, we don't need a local path
      return 'uploads';
    }
    // For local storage, ensure we have a valid path
    if (!val) {
      return path.join(process.cwd(), 'uploads');
    }
    // If path is absolute, make it relative to cwd
    return path.isAbsolute(val) ? path.join(process.cwd(), path.basename(val)) : val;
  }),
  
  // AWS S3 Configuration (required if storage type is s3)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

export type FilesEnvConfig = z.infer<typeof filesEnvSchema>;

export function validateFilesEnv(env: Record<string, any>): FilesEnvConfig {
  const result = filesEnvSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  const config = result.data;


  // Validate service-specific requirements
  if (config.FILE_STORAGE_TYPE === 's3') {
    if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY || !config.AWS_REGION || !config.AWS_S3_BUCKET) {
      throw new Error('AWS S3 configuration missing required environment variables');
    }
  }

  // Validate MongoDB URI
  if (!config.MONGODB_URI) {
    throw new Error('MongoDB URI is required');
  }

  return config;
}
