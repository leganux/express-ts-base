import joi from 'joi';
import { logger } from '../utils/logger';

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  LOG_LEVEL: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  // File Storage Configuration
  FILE_STORAGE_TYPE: 'local' | 's3';
  FILE_UPLOAD_PATH: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;
  // Email Configuration
  EMAIL_SERVICE: 'ses' | 'smtp';
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM: string;
  AWS_SES_REGION: string;
  // Payment Plugin Configuration
  OPENPAY_MERCHANT_ID?: string;
  OPENPAY_PRIVATE_KEY?: string;
  OPENPAY_SANDBOX?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_SANDBOX?: string;
}

const envSchema = joi.object({
  NODE_ENV: joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),

  PORT: joi.number()
    .port()
    .default(3000)
    .description('Port number for the server to listen on'),

  MONGODB_URI: joi.string()
    .required()
    .pattern(/^mongodb:\/\/.+/)
    .description('MongoDB connection URI')
    .messages({
      'string.pattern.base': 'MONGODB_URI must be a valid MongoDB connection string starting with mongodb://',
      'any.required': 'MONGODB_URI is required'
    }),

  LOG_LEVEL: joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info')
    .description('Logging level'),

  // Firebase Web Config
  FIREBASE_API_KEY: joi.string()
    .required()
    .description('Firebase Web API Key'),

  FIREBASE_AUTH_DOMAIN: joi.string()
    .required()
    .description('Firebase Auth Domain'),

  FIREBASE_PROJECT_ID: joi.string()
    .required()
    .description('Firebase Project ID'),

  FIREBASE_STORAGE_BUCKET: joi.string()
    .required()
    .description('Firebase Storage Bucket'),

  FIREBASE_MESSAGING_SENDER_ID: joi.string()
    .required()
    .description('Firebase Messaging Sender ID'),

  FIREBASE_APP_ID: joi.string()
    .required()
    .description('Firebase App ID'),

  FIREBASE_MEASUREMENT_ID: joi.string()
    .required()
    .description('Firebase Measurement ID'),

  // Firebase Admin Config
  FIREBASE_ADMIN_PROJECT_ID: joi.string()
    .required()
    .description('Firebase Admin Project ID'),

  FIREBASE_ADMIN_PRIVATE_KEY: joi.string()
    .required()
    .description('Firebase Admin Private Key')
    .custom((value, helpers) => {
      return value.replace(/\\n/g, '\n');
    }),

  FIREBASE_ADMIN_CLIENT_EMAIL: joi.string()
    .required()
    .email()
    .description('Firebase Admin Client Email'),

  // File Storage Configuration
  FILE_STORAGE_TYPE: joi.string()
    .valid('local', 's3')
    .required()
    .description('File storage type (local or s3)'),

  FILE_UPLOAD_PATH: joi.string()
    .when('FILE_STORAGE_TYPE', {
      is: 'local',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('Local file upload path'),

  AWS_REGION: joi.string()
    .when('FILE_STORAGE_TYPE', {
      is: 's3',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('AWS Region'),

  AWS_ACCESS_KEY_ID: joi.string()
    .when('FILE_STORAGE_TYPE', {
      is: 's3',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('AWS Access Key ID'),

  AWS_SECRET_ACCESS_KEY: joi.string()
    .when('FILE_STORAGE_TYPE', {
      is: 's3',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('AWS Secret Access Key'),

  AWS_S3_BUCKET: joi.string()
    .when('FILE_STORAGE_TYPE', {
      is: 's3',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('AWS S3 Bucket name'),

  // Email Configuration
  EMAIL_SERVICE: joi.string()
    .valid('ses', 'smtp')
    .required()
    .description('Email service type (ses or smtp)'),

  SMTP_HOST: joi.string()
    .when('EMAIL_SERVICE', {
      is: 'smtp',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('SMTP host'),

  SMTP_PORT: joi.number()
    .when('EMAIL_SERVICE', {
      is: 'smtp',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('SMTP port'),

  SMTP_USER: joi.string()
    .when('EMAIL_SERVICE', {
      is: 'smtp',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('SMTP username'),

  SMTP_PASS: joi.string()
    .when('EMAIL_SERVICE', {
      is: 'smtp',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('SMTP password'),

  EMAIL_FROM: joi.string()
    .required()
    .email()
    .description('Email from address'),

  AWS_SES_REGION: joi.string()
    .when('EMAIL_SERVICE', {
      is: 'ses',
      then: joi.required(),
      otherwise: joi.optional()
    })
    .description('AWS SES Region'),

  // Payment Plugin Configuration
  OPENPAY_MERCHANT_ID: joi.string()
    .optional()
    .description('OpenPay Merchant ID'),

  OPENPAY_PRIVATE_KEY: joi.string()
    .optional()
    .description('OpenPay Private Key'),

  OPENPAY_SANDBOX: joi.string()
    .valid('true', 'false')
    .optional()
    .default('true')
    .description('OpenPay Sandbox Mode'),

  MERCADOPAGO_ACCESS_TOKEN: joi.string()
    .optional()
    .description('MercadoPago Access Token'),

  MERCADOPAGO_SANDBOX: joi.string()
    .valid('true', 'false')
    .optional()
    .default('true')
    .description('MercadoPago Sandbox Mode')
}).unknown();

export const validateEnv = (): EnvConfig => {
  try {
    const envVars: any = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/apiato-demo',
      LOG_LEVEL: process.env.LOG_LEVEL,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FILE_STORAGE_TYPE: process.env.FILE_STORAGE_TYPE,
      FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
      EMAIL_SERVICE: process.env.EMAIL_SERVICE,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      EMAIL_FROM: process.env.EMAIL_FROM,
      AWS_SES_REGION: process.env.AWS_SES_REGION,
      // Payment Plugin Configuration
      OPENPAY_MERCHANT_ID: process.env.OPENPAY_MERCHANT_ID,
      OPENPAY_PRIVATE_KEY: process.env.OPENPAY_PRIVATE_KEY,
      OPENPAY_SANDBOX: process.env.OPENPAY_SANDBOX,
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
      MERCADOPAGO_SANDBOX: process.env.MERCADOPAGO_SANDBOX
    };

    const { error, value } = envSchema.validate(envVars, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('\n');
      
      logger.error('Environment validation error:', errorMessage);
      throw new Error(`Environment validation error:\n${errorMessage}`);
    }

    logger.info('Environment variables validated successfully');
    logger.debug('Validated env config:', {
      ...value,
      MONGODB_URI: value.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      FIREBASE_API_KEY: '***',
      FIREBASE_ADMIN_PRIVATE_KEY: '***',
      AWS_ACCESS_KEY_ID: '***',
      AWS_SECRET_ACCESS_KEY: '***',
      SMTP_PASS: '***'
    });

    return value;
  } catch (error) {
    logger.error('Failed to validate environment variables:', error);
    throw error;
  }
};
