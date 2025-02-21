import { Schema } from 'mongoose';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteInfo {
  path: string;
  method: HttpMethod;
  handler: string | Function;
  middleware?: Function[];
}

export interface SwaggerRouteConfig {
  tags: string[];
  summary: string;
  security?: { [key: string]: string[] }[];
  requestBody?: boolean;
  parameters?: { [key: string]: string }[];
}

interface SchemaProperty {
  type: string;
  enum?: any[];
  format?: string;
}

function getSchemaType(schemaType: any): string {
  switch (schemaType) {
    case String:
      return 'string';
    case Number:
      return 'number';
    case Boolean:
      return 'boolean';
    case Date:
      return 'string';
    default:
      return 'string';
  }
}

function generateSchemaProperties(mongooseSchema: Schema): { properties: { [key: string]: SchemaProperty }, required: string[] } {
  const properties: { [key: string]: SchemaProperty } = {};
  const required: string[] = [];

  Object.keys(mongooseSchema.paths).forEach(path => {
    if (path === '__v' || path === '_id') return;

    const schemaType = mongooseSchema.paths[path] as any;
    const property: SchemaProperty = {
      type: getSchemaType(schemaType.instance),
    };

    // Handle enums from schema options
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

function generateResponseExample(properties: { [key: string]: SchemaProperty }): any {
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

export function generateSwaggerDocs(
  moduleName: string,
  mongooseSchema: Schema | null,
  routes: RouteInfo[],
  configs: { [path: string]: SwaggerRouteConfig }
): string {
  const { properties, required } = mongooseSchema ? generateSchemaProperties(mongooseSchema) : { properties: {}, required: [] };
  let swaggerDocs = '';

  routes.forEach(route => {
    const configKey = route.method === 'get' ? route.path : `${route.method}-${route.path}`;
    const config = configs[configKey] || {
      tags: [moduleName],
      summary: `${route.method.toUpperCase()} ${route.path}`,
      security: [{ BearerAuth: [] }]
    };

    const fullPath = `/api/v1/${moduleName}${route.path}`;

    let doc = `
/**
 * @openapi
 * ${fullPath}:
 *   ${route.method}:
 *     tags:
 *       - ${config.tags.join('\n *       - ')}
 *     summary: ${config.summary}`;

    if (config.security) {
      doc += `
 *     security:
 *       - BearerAuth: []`;
    }

    if (config.parameters) {
      doc += `
 *     parameters:`;
      config.parameters.forEach(param => {
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

    if (config.requestBody && mongooseSchema) {
      doc += `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ${JSON.stringify(required)}
 *             properties:
 *               ${Object.entries(properties).map(([key, prop]) => 
                  `${key}:
 *                 type: ${prop.type}${prop.enum ? `\n *                 enum: ${JSON.stringify(prop.enum)}` : ''}${prop.format ? `\n *                 format: ${prop.format}` : ''}`
                ).join('\n *               ')}`;
    }

    doc += `
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: ${JSON.stringify(generateResponseExample(properties), null, 2).split('\n').join('\n *               ')}
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: ${JSON.stringify(generateErrorExample(), null, 2).split('\n').join('\n *               ')}
 */`;

    swaggerDocs += doc;
  });

  return swaggerDocs;
}
