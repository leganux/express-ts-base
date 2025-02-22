import joi from 'joi';

export interface StripeEnvConfig {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
}

export const stripeEnvSchema = {
    STRIPE_SECRET_KEY: joi.string()
        .required()
        .description('Stripe Secret Key'),

    STRIPE_WEBHOOK_SECRET: joi.string()
        .required()
        .description('Stripe Webhook Secret')
};
