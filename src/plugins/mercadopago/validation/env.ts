import joi from 'joi';

export interface MercadopagoEnvConfig {
    MERCADOPAGO_ACCESS_TOKEN: string;
    MERCADOPAGO_SANDBOX: string;
}

export const mercadopagoEnvSchema = {
    MERCADOPAGO_ACCESS_TOKEN: joi.string()
        .required()
        .description('MercadoPago Access Token'),

    MERCADOPAGO_SANDBOX: joi.string()
        .valid('true', 'false')
        .default('true')
        .description('MercadoPago Sandbox Mode')
};
