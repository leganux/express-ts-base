import joi from 'joi';

export interface OpenpayEnvConfig {
    OPENPAY_MERCHANT_ID: string;
    OPENPAY_PRIVATE_KEY: string;
    OPENPAY_SANDBOX: string;
}

export const openpayEnvSchema = {
    OPENPAY_MERCHANT_ID: joi.string()
        .required()
        .description('OpenPay Merchant ID'),

    OPENPAY_PRIVATE_KEY: joi.string()
        .required()
        .description('OpenPay Private Key'),

    OPENPAY_SANDBOX: joi.string()
        .valid('true', 'false')
        .default('true')
        .description('OpenPay Sandbox Mode')
};
