import joi from 'joi';
import path from 'path';

export interface WhatsAppEnvConfig {
    WHATSAPP_AUTH_FOLDER: string;
    WHATSAPP_MEDIA_STORAGE_TYPE: 'local' | 's3';
    WHATSAPP_UPLOAD_PATH: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
}

export const whatsappEnvSchema = {
    WHATSAPP_AUTH_FOLDER: joi.string()
        .default('auth_info_baileys')
        .custom((value) => {
            return path.isAbsolute(value) ? path.join(process.cwd(), path.basename(value)) : value;
        })
        .description('WhatsApp authentication folder path'),

    WHATSAPP_MEDIA_STORAGE_TYPE: joi.string()
        .valid('local', 's3')
        .default('local')
        .description('WhatsApp media storage type (local or s3)'),

    WHATSAPP_UPLOAD_PATH: joi.string()
        .when('WHATSAPP_MEDIA_STORAGE_TYPE', {
            is: 'local',
            then: joi.string().custom((value) => {
                if (!value) {
                    return path.join(process.cwd(), 'uploads/whatsapp');
                }
                return path.isAbsolute(value) ? path.join(process.cwd(), path.basename(value)) : value;
            }),
            otherwise: joi.string().default('uploads/whatsapp')
        })
        .description('WhatsApp media upload path'),

    AWS_ACCESS_KEY_ID: joi.string()
        .when('WHATSAPP_MEDIA_STORAGE_TYPE', {
            is: 's3',
            then: joi.required(),
            otherwise: joi.optional()
        })
        .description('AWS Access Key ID'),

    AWS_SECRET_ACCESS_KEY: joi.string()
        .when('WHATSAPP_MEDIA_STORAGE_TYPE', {
            is: 's3',
            then: joi.required(),
            otherwise: joi.optional()
        })
        .description('AWS Secret Access Key'),

    AWS_REGION: joi.string()
        .when('WHATSAPP_MEDIA_STORAGE_TYPE', {
            is: 's3',
            then: joi.required(),
            otherwise: joi.optional()
        })
        .description('AWS Region'),

    AWS_S3_BUCKET: joi.string()
        .when('WHATSAPP_MEDIA_STORAGE_TYPE', {
            is: 's3',
            then: joi.required(),
            otherwise: joi.optional()
        })
        .description('AWS S3 Bucket name')
};

// For internal plugin use
export function validateWhatsappEnv(env: Record<string, any>): WhatsAppEnvConfig {
    const schema = joi.object(whatsappEnvSchema);
    const { error, value } = schema.validate(env, { 
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        throw new Error(`Invalid WhatsApp environment variables: ${error.message}`);
    }

    return value;
}
