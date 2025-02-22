import joi from 'joi';

export interface SkydropxEnvConfig {
    SKYDROPX_API_KEY: string;
}

export const skydropxEnvSchema = {
    SKYDROPX_API_KEY: joi.string()
        .required()
        .description('Skydropx API Key')
};
