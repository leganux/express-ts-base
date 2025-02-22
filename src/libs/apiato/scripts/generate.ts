#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import * as ts from 'typescript';

interface SchemaInfo {
  modelName: string;
  interfaceName: string;
  properties: {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    enum?: string[];
  }[];
}

function extractSchemaInfo(filePath: string): SchemaInfo {
  const fileContent = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  let modelName = '';
  let interfaceName = '';
  const properties: SchemaInfo['properties'] = [];

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      interfaceName = node.name.text;
      node.members.forEach((member) => {
        if (ts.isPropertySignature(member)) {
          const name = member.name.getText(sourceFile);
          const type = member.type?.getText(sourceFile) || 'any';
          const required = !member.questionToken;
          properties.push({ name, type, required });
        }
      });
    }

    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration.name.getText(sourceFile).endsWith('Model')) {
        if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
          modelName = declaration.name.getText(sourceFile);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    modelName,
    interfaceName,
    properties,
  };
}

function generateController(schemaInfo: SchemaInfo, outputPath: string) {
  const content = `import { Request, Response } from 'express';
import { ${schemaInfo.modelName}, ${schemaInfo.interfaceName} } from './model';

interface ApiError {
  message: string;
  [key: string]: any;
}

export class ${schemaInfo.modelName.replace('Model', 'Controller')} {
  /**
   * Custom operation example: Get by custom field
   */
  static async getByField(req: Request, res: Response) {
    try {
      const { field, value } = req.params;
      const item = await ${schemaInfo.modelName}.findOne({ [field]: value });

      if (!item) {
        return res.status(404).json({
          error: 'Not found',
          success: false,
          message: 'Item not found',
          code: 404,
          data: {}
        });
      }

      return res.status(200).json({
        error: {},
        success: true,
        message: 'Item found',
        code: 200,
        data: item
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error as ApiError,
        success: false,
        message: error.message,
        code: 500,
        data: {}
      });
    }
  }
}`;

  writeFileSync(outputPath, content);
}

function generateRoutes(schemaInfo: SchemaInfo, outputPath: string) {
  const content = `import { Router } from 'express';
import { ${schemaInfo.modelName} } from './model';
import { ApiatoNoSQL } from '../../libs/apiato/no-sql/apiato';
import { ${schemaInfo.modelName.replace('Model', 'Controller')} } from './controller';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';

const router = Router();
const apiato = new ApiatoNoSQL();

// Apply authentication middleware to all routes
router.use(validateFirebaseToken);

// Validation schema
const validationSchema = {
  ${schemaInfo.properties
    .map((prop) => `${prop.name}: '${prop.type},${prop.required ? 'mandatory' : ''}'`)
    .join(',\n  ')}
};

// Population object (empty since we don't have relations yet)
const populationObject = {};

// Create a new item (Admin only)
router.post('/', roleGuard([UserRole.ADMIN]), apiato.createOne(
  ${schemaInfo.modelName},
  validationSchema,
  populationObject,
  { customValidationCode: 400 }
));

// Get all items with pagination (Admin only)
router.get('/', roleGuard([UserRole.ADMIN]), apiato.getMany(
  ${schemaInfo.modelName},
  populationObject
));

// Get item by ID
router.get('/:id', apiato.getOneById(
  ${schemaInfo.modelName},
  populationObject
));

// Update item by ID
router.put('/:id', apiato.updateById(
  ${schemaInfo.modelName},
  validationSchema,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

// Delete item by ID (Admin only)
router.delete('/:id', roleGuard([UserRole.ADMIN]), apiato.findIdAndDelete(
  ${schemaInfo.modelName}
));

// Additional Apiato operations
router.post('/find-update-create', roleGuard([UserRole.ADMIN]), apiato.findUpdateOrCreate(
  ${schemaInfo.modelName},
  validationSchema,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

router.put('/find-update', roleGuard([UserRole.ADMIN]), apiato.findUpdate(
  ${schemaInfo.modelName},
  validationSchema,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

router.get('/where/first', roleGuard([UserRole.ADMIN]), apiato.getOneWhere(
  ${schemaInfo.modelName},
  populationObject
));

// Custom operations example
router.get('/field/:field/:value', roleGuard([UserRole.ADMIN]), ${schemaInfo.modelName.replace('Model', 'Controller')}.getByField);

export default router;`;

  writeFileSync(outputPath, content);
}

function generateSwagger(schemaInfo: SchemaInfo, outputPath: string) {
  const modelName = schemaInfo.modelName.replace('Model', '');
  const content = `export const ${modelName.toLowerCase()}SwaggerDocs = \`
/**
 * @swagger
 * components:
 *   schemas:
 *     ${modelName}:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Item ID
 *         ${schemaInfo.properties
           .map(
             (prop) => `${prop.name}:
 *           type: ${prop.type.toLowerCase()}
 *           description: ${prop.description || prop.name}${
               prop.enum ? `\n *           enum: [${prop.enum.join(', ')}]` : ''
             }`
           )
           .join('\n *         ')}
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/${modelName.toLowerCase()}s:
 *   post:
 *     tags:
 *       - ${modelName}s
 *     summary: Create a new ${modelName.toLowerCase()}
 *     description: Create a new ${modelName.toLowerCase()} (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${modelName}'
 *     responses:
 *       200:
 *         description: ${modelName} created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 *   get:
 *     tags:
 *       - ${modelName}s
 *     summary: Get all ${modelName.toLowerCase()}s
 *     description: Get all ${modelName.toLowerCase()}s with pagination (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paginate
 *         schema:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *       - in: query
 *         name: where
 *         schema:
 *           type: object
 *       - in: query
 *         name: like
 *         schema:
 *           type: object
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: object
 *       - in: query
 *         name: populate
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: List of ${modelName.toLowerCase()}s
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 * /api/v1/${modelName.toLowerCase()}s/{id}:
 *   get:
 *     tags:
 *       - ${modelName}s
 *     summary: Get ${modelName.toLowerCase()} by ID
 *     description: Get ${modelName.toLowerCase()} by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${modelName} found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 *   put:
 *     tags:
 *       - ${modelName}s
 *     summary: Update ${modelName.toLowerCase()} by ID
 *     description: Update ${modelName.toLowerCase()} by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${modelName}'
 *     responses:
 *       200:
 *         description: ${modelName} updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 *   delete:
 *     tags:
 *       - ${modelName}s
 *     summary: Delete ${modelName.toLowerCase()} by ID
 *     description: Delete ${modelName.toLowerCase()} by ID (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${modelName} deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 *
 * /api/v1/${modelName.toLowerCase()}s/find-update-create:
 *   post:
 *     tags:
 *       - ${modelName}s
 *     summary: Find and update or create ${modelName.toLowerCase()}
 *     description: Find ${modelName.toLowerCase()} by criteria and update, or create if not found (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               where:
 *                 type: object
 *               data:
 *                 $ref: '#/components/schemas/${modelName}'
 *     responses:
 *       200:
 *         description: ${modelName} updated or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *
 * /api/v1/${modelName.toLowerCase()}s/find-update:
 *   put:
 *     tags:
 *       - ${modelName}s
 *     summary: Find and update ${modelName.toLowerCase()}
 *     description: Find ${modelName.toLowerCase()} by criteria and update (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               where:
 *                 type: object
 *               data:
 *                 $ref: '#/components/schemas/${modelName}'
 *     responses:
 *       200:
 *         description: ${modelName} updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 *
 * /api/v1/${modelName.toLowerCase()}s/where/first:
 *   get:
 *     tags:
 *       - ${modelName}s
 *     summary: Get first ${modelName.toLowerCase()} by criteria
 *     description: Get first ${modelName.toLowerCase()} matching the where criteria (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: where
 *         schema:
 *           type: object
 *       - in: query
 *         name: like
 *         schema:
 *           type: object
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: object
 *       - in: query
 *         name: populate
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: ${modelName} found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 *
 * /api/v1/${modelName.toLowerCase()}s/field/{field}/{value}:
 *   get:
 *     tags:
 *       - ${modelName}s
 *     summary: Get ${modelName.toLowerCase()} by field
 *     description: Get ${modelName.toLowerCase()} by specific field value (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${modelName} found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           description: Error details if any
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         code:
 *           type: number
 *           description: HTTP status code
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/${modelName}'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/${modelName}'
 *             - type: object
 *           description: Response data
 */\`;`;

  writeFileSync(outputPath, content);
}

function generateModule(schemaPath: string) {
  try {
    const schemaInfo = extractSchemaInfo(schemaPath);
    const moduleDir = dirname(schemaPath);
    
    // Generate controller
    generateController(schemaInfo, join(moduleDir, 'controller.ts'));
    console.log('✓ Generated controller');

    // Generate routes
    generateRoutes(schemaInfo, join(moduleDir, 'routes.ts'));
    console.log('✓ Generated routes');

    // Generate swagger
    generateSwagger(schemaInfo, join(moduleDir, 'swagger.ts'));
    console.log('✓ Generated swagger documentation');

    console.log('\nModule generated successfully! 🚀');
    console.log(`Location: ${moduleDir}`);
  } catch (error) {
    console.error('Error generating module:', error);
    process.exit(1);
  }
}

// Check if path argument is provided
if (process.argv.length < 3) {
  console.error('Please provide the path to the schema file');
  console.error('Example: ts-node generate.ts src/modules/users/model.ts');
  process.exit(1);
}

generateModule(process.argv[2]);
