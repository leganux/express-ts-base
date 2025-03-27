import { z } from 'zod';
import { logger } from '../../../utils/logger';

const facturamaEnvSchema = z.object({
    FACTURAMA_USERNAME: z.string({
        required_error: 'FACTURAMA_USERNAME is required',
        invalid_type_error: 'FACTURAMA_USERNAME must be a string'
    }),
    FACTURAMA_PASSWORD: z.string({
        required_error: 'FACTURAMA_PASSWORD is required',
        invalid_type_error: 'FACTURAMA_PASSWORD must be a string'
    }),
    FACTURAMA_IS_SANDBOX: z.string().transform((val) => val === 'true')
});

export const validateFacturamaEnv = (env: Record<string, any>) => {
    try {
        return facturamaEnvSchema.parse({
            FACTURAMA_USERNAME: env.FACTURAMA_USERNAME,
            FACTURAMA_PASSWORD: env.FACTURAMA_PASSWORD,
            FACTURAMA_IS_SANDBOX: env.FACTURAMA_IS_SANDBOX || 'true'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
            logger.error(`Facturama environment validation failed: ${issues}`);
            throw new Error(`Facturama environment validation failed: ${issues}`);
        }
        throw error;
    }
};
