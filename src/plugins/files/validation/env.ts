import { z } from 'zod';

export const filesEnvSchema = z.object({
  FILE_STORAGE_TYPE: z.enum(['local', 's3']),
  FILE_UPLOAD_PATH: z.string(),
  
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

  return config;
}
