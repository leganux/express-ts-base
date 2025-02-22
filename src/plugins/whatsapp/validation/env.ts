import joi from 'joi';

export interface WhatsAppEnvConfig {
    WHATSAPP_API_KEY: string;
    WHATSAPP_WEBHOOK_SECRET: string;
}

export const whatsappEnvSchema = {
    WHATSAPP_API_KEY: joi.string()
        .optional()
        .description('WhatsApp API Key (Optional)'),

    WHATSAPP_WEBHOOK_SECRET: joi.string()
        .optional()
        .description('WhatsApp Webhook Secret (Optional)')
};
