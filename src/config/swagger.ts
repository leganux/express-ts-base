import swaggerJsdoc from 'swagger-jsdoc';
import { join } from 'path';

const modulesPath = join(__dirname, '../modules');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express TypeScript API',
      version: '1.0.0',
      description: 'API documentation for Express TypeScript Base',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      examples: {
        SuccessfulSingleUpload: {
          value: {
            error: null,
            success: true,
            message: "File uploaded successfully",
            code: 200,
            data: {
              filepath: "/uploads/file-1234567890.jpg"
            }
          }
        },
        SuccessfulMultipleUpload: {
          value: {
            error: null,
            success: true,
            message: "Files uploaded successfully",
            code: 200,
            data: {
              filepaths: [
                "/uploads/file-1234567890.jpg",
                "/uploads/file-0987654321.pdf"
              ]
            }
          }
        },
        SuccessfulDelete: {
          value: {
            error: null,
            success: true,
            message: "File deleted successfully",
            code: 200,
            data: {}
          }
        },
        ErrorNoFile: {
          value: {
            error: "No file uploaded",
            success: false,
            message: "Please provide a file",
            code: 400,
            data: {}
          }
        },
        ErrorFileNotFound: {
          value: {
            error: "File not found",
            success: false,
            message: "The requested file does not exist",
            code: 404,
            data: {}
          }
        },
        ErrorInvalidFileType: {
          value: {
            error: "Invalid file type. Only images and PDFs are allowed.",
            success: false,
            message: "File upload error",
            code: 400,
            data: {}
          }
        }
      }
    },
  },
  apis: [
    // Module routes
    join(modulesPath, '**/routes.ts'),
    join(modulesPath, '**/swagger.ts'),
    // Plugin routes and swagger files
    join(__dirname, '../plugins/**/routes.ts'),
    join(__dirname, '../plugins/**/swagger.ts')
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
