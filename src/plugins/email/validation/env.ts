import { z } from 'zod';

export const emailEnvSchema = z.object({
  EMAIL_SERVICE: z.enum(['ses', 'smtp']),
  EMAIL_FROM: z.string().email(),
  
  // AWS SES Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().optional(),

  // SMTP Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type EmailEnvConfig = z.infer<typeof emailEnvSchema>;

export function validateEmailEnv(env: Record<string, any>): EmailEnvConfig {
  const result = emailEnvSchema.safeParse(env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  const config = result.data;

  // Validate service-specific requirements
  if (config.EMAIL_SERVICE === 'ses') {
    if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY || !config.AWS_SES_REGION) {
      throw new Error('AWS SES configuration missing required environment variables');
    }
  } else if (config.EMAIL_SERVICE === 'smtp') {
    if (!config.SMTP_HOST || !config.SMTP_PORT || !config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error('SMTP configuration missing required environment variables');
    }
  }

  return config;
}
