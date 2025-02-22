import joi from 'joi';

export interface EnviacomEnvConfig {
    ENVIACOM_API_KEY: string;
}

export const enviacomEnvSchema = {
    ENVIACOM_API_KEY: joi.string()
        .required()
        .description('Enviacom API Key')
};
