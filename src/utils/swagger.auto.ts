import { Schema } from 'mongoose';
import { Router } from 'express';
import { readdirSync } from 'fs';
import { join } from 'path';

interface RouteMetadata {
  path: string;
  method: string;
  handler: string;
  middleware?: string[];
  description?: string;
  requestBody?: boolean;
  parameters?: { [key: string]: string }[];
}

interface ModuleConfig {
  name: string;
  schema?: Schema;
  routes: RouteMetadata[];
}

function generateSchemaProperties(schema: Schema): { properties: any; required: string[] } {
  const properties: any = {};
  const required: string[] = [];

  Object.keys(schema.paths).forEach(path => {
    if (path === '__v' || path === '_id') return;

    const schemaType = schema.paths[path] as any;
    const property: any = {
      type: getSchemaType(schemaType.instance),
    };

    // Handle enums
    if (schemaType.options?.enum?.length > 0) {
      property.enum = schemaType.options.enum;
    }

    // Handle required fields
    if (schemaType.options?.required) {
      required.push(path);
    }

    // Handle dates
    if (schemaType.instance === 'Date') {
      property.format = 'date-time';
    }

    properties[path] = property;
  });

  return { properties, required };
}

function getSchemaType(type: string): string {
  switch (type) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'string';
    case 'ObjectID':
      return 'string';
    default:
      return 'string';
  }
}

function generateResponseExample(properties: any): any {
  const example: any = {};
  
  Object.keys(properties).forEach(key => {
    const prop = properties[key];
    switch (prop.type) {
      case 'string':
        example[key] = prop.enum ? prop.enum[0] : 'example';
        break;
      case 'number':
        example[key] = 0;
        break;
      case 'boolean':
        example[key] = false;
        break;
      default:
        example[key] = null;
    }
  });

  return {
    error: null,
    success: true,
    message: 'Operation successful',
    code: 200,
    data: example
  };
}

function generateErrorExample(message: string = 'Operation failed'): any {
  return {
    error: message,
    success: false,
    message,
    code: 400,
    data: {}
  };
}

function generateSwaggerForModule(config: ModuleConfig): string {
  let swaggerDocs = '';
  const { properties, required } = config.schema ? generateSchemaProperties(config.schema) : { properties: {}, required: [] };

  config.routes.forEach(route => {
    const fullPath = `/api/v1/${config.name}${route.path}`;
    
    let doc = `
/**
 * @swagger
 * ${fullPath}:
 *   ${route.method}:
 *     tags:
 *       - ${config.name}
 *     summary: ${route.description || `${route.method.toUpperCase()} ${route.path}`}
 *     security:
 *       - BearerAuth: []`;

    if (route.parameters?.length) {
      doc += `
 *     parameters:`;
      route.parameters.forEach(param => {
        const [name, description] = Object.entries(param)[0];
        doc += `
 *       - in: path
 *         name: ${name}
 *         required: true
 *         schema:
 *           type: string
 *         description: ${description}`;
      });
    }

    if (route.requestBody && config.schema) {
      doc += `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ${JSON.stringify(required)}
 *             properties: ${JSON.stringify(properties, null, 2)}`;
    }

    doc += `
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: ${JSON.stringify(generateResponseExample(properties), null, 2)}
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: ${JSON.stringify(generateErrorExample(), null, 2)}
 */`;

    swaggerDocs += doc;
  });

  return swaggerDocs;
}

export function autoGenerateSwagger(modulesPath: string): void {
  const modules = readdirSync(modulesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  modules.forEach(moduleName => {
    const modulePath = join(modulesPath, moduleName);
    try {
      // Try to import model if it exists
      let schema: Schema | undefined;
      try {
        const model = require(join(modulePath, 'model'));
        schema = model.schema;
      } catch (e) {
        // No model file, continue without schema
      }

      // Get routes configuration
      const routes = require(join(modulePath, 'routes'));
      const routeMetadata: RouteMetadata[] = [];

      // Extract route metadata
      const router = routes.default as Router;
      (router as any).stack?.forEach((layer: any) => {
        if (layer.route) {
          routeMetadata.push({
            path: layer.route.path,
            method: Object.keys(layer.route.methods)[0],
            handler: layer.route.stack[0].name || 'anonymous',
            middleware: layer.route.stack.slice(0, -1).map((mw: any) => mw.name),
            requestBody: ['post', 'put', 'patch'].includes(Object.keys(layer.route.methods)[0])
          });
        }
      });

      // Generate swagger documentation
      const moduleConfig: ModuleConfig = {
        name: moduleName,
        schema,
        routes: routeMetadata
      };

      const swaggerDocs = generateSwaggerForModule(moduleConfig);

      // Write swagger docs to file
      const fs = require('fs');
      fs.writeFileSync(
        join(modulePath, 'swagger.ts'),
        `export const ${moduleName}SwaggerDocs = \`${swaggerDocs}\`;`
      );

    } catch (error) {
      console.error(`Error generating swagger for module ${moduleName}:`, error);
    }
  });
}
