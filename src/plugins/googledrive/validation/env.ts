import { z } from 'zod';

export const googledriveEnvSchema = z.object({
    GOOGLE_APPLICATION_CREDENTIALS: z.string({
        required_error: 'GOOGLE_APPLICATION_CREDENTIALS is required',
        invalid_type_error: 'GOOGLE_APPLICATION_CREDENTIALS must be a string',
    }).min(1, 'GOOGLE_APPLICATION_CREDENTIALS cannot be empty'),
});

export type GoogleDriveEnv = z.infer<typeof googledriveEnvSchema>;
