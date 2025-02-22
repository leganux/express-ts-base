#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PluginConfig {
  enabled: boolean;
  config: Record<string, any>;
}

function generatePluginFiles(pluginName: string) {
  const baseDir = join(process.cwd(), 'src', 'plugins', pluginName);
  const modelsDir = join(baseDir, 'models');
  const validationDir = join(baseDir, 'validation');

  // Create directories
  mkdirSync(baseDir, { recursive: true });
  mkdirSync(modelsDir, { recursive: true });
  mkdirSync(validationDir, { recursive: true });

  // Generate index.ts
  const indexContent = `import { Router } from 'express';
import { z } from 'zod';
import routes from './routes';
import mongoose from 'mongoose';

// Plugin configuration type
export interface ${pluginName}Config {
  dbUri?: string;
  apiKey?: string;
  // Add other configuration options
}

// Plugin class must implement Plugin interface
export class ${pluginName}Plugin implements Plugin {
  public name = '${pluginName}';
  public version = '1.0.0';
  public routes: Router;
  private config: ${pluginName}Config;
  private dbConnection?: mongoose.Connection;

  constructor(config: ${pluginName}Config = {}) {
    this.config = config;
    this.routes = routes;
  }

  // Initialize plugin
  async init(): Promise<void> {
    try {
      // Connect to plugin-specific database if URI is provided
      if (this.config.dbUri) {
        this.dbConnection = await mongoose.createConnection(this.config.dbUri);
        console.log(\`[\${this.name}] Connected to database\`);
      }
      
      console.log(\`[\${this.name}] Plugin initialized\`);
    } catch (error) {
      console.error(\`[\${this.name}] Initialization error:\`, error);
      throw error;
    }
  }

  // Cleanup when plugin is disabled
  async destroy(): Promise<void> {
    try {
      // Close database connection if exists
      if (this.dbConnection) {
        await this.dbConnection.close();
        console.log(\`[\${this.name}] Database connection closed\`);
      }
      
      console.log(\`[\${this.name}] Plugin destroyed\`);
    } catch (error) {
      console.error(\`[\${this.name}] Cleanup error:\`, error);
      throw error;
    }
  }
}

// Environment variables validation schema
export const envSchema = z.object({
  [\`\${pluginName.toUpperCase()}_DB_URI\`]: z.string().url().optional(),
  [\`\${pluginName.toUpperCase()}_API_KEY\`]: z.string().optional()
});

// Default export must be the plugin class
export default ${pluginName}Plugin;`;

  // Generate routes.ts
  const routesContent = `import { Router } from 'express';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';
import { ExampleModel } from './models/example.model';

const router = Router();

// Apply authentication middleware
router.use(validateFirebaseToken);

// Example route with database access
router.get('/', roleGuard([UserRole.ADMIN]), async (req, res) => {
  try {
    const items = await ExampleModel.find();
    
    res.json({
      error: {},
      success: true,
      message: 'Items retrieved successfully',
      code: 200,
      data: items
    });
  } catch (error: any) {
    res.status(500).json({
      error,
      success: false,
      message: error.message,
      code: 500,
      data: {}
    });
  }
});

export default router;`;

  // Generate example.model.ts
  const modelContent = `import mongoose, { Document, Schema } from 'mongoose';

export interface IExample extends Document {
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const ExampleModel = mongoose.model<IExample>('Example', exampleSchema);`;

  // Generate swagger.ts
  const swaggerContent = `export const ${pluginName}SwaggerDocs = \`
/**
 * @swagger
 * components:
 *   schemas:
 *     Example:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Item ID
 *         name:
 *           type: string
 *           description: Item name
 *         description:
 *           type: string
 *           description: Item description
 *         active:
 *           type: boolean
 *           description: Item status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/${pluginName}:
 *   get:
 *     tags:
 *       - ${pluginName}
 *     summary: Get all items
 *     description: Retrieve all items (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 code:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Example'
 */\`;`;

  // Generate env.ts
  const envContent = `import { z } from 'zod';

export const schema = z.object({
  ${pluginName.toUpperCase()}_DB_URI: z.string().url().optional(),
  ${pluginName.toUpperCase()}_API_KEY: z.string().optional()
});`;

  // Generate README.md
  const readmeContent = `# ${pluginName} Plugin

## Description
A plugin for handling ${pluginName} functionality.

## Installation

1. Enable the plugin in \`src/plugins/config.json\`:
\`\`\`json
{
  "${pluginName}": {
    "enabled": true,
    "config": {
      "dbUri": "mongodb://localhost:27017/${pluginName}",
      "apiKey": "your-api-key"
    }
  }
}
\`\`\`

2. Add environment variables to \`.env\`:
\`\`\`env
${pluginName.toUpperCase()}_DB_URI=mongodb://localhost:27017/${pluginName}
${pluginName.toUpperCase()}_API_KEY=your-api-key
\`\`\`

## API Endpoints

### Get All Items
\`\`\`http
GET /api/v1/${pluginName}
Authorization: Bearer your-token
\`\`\`

## Configuration Options

- \`dbUri\`: MongoDB connection string for plugin-specific database
- \`apiKey\`: API key for external service integration

## Development

1. Update models in \`models/\` directory
2. Add routes in \`routes.ts\`
3. Update swagger documentation in \`swagger.ts\`
4. Add environment variables to \`validation/env.ts\`

## Security

- All endpoints require authentication
- Admin-only routes are protected with role guard
- Environment variables are validated at startup
`;

  // Write files
  writeFileSync(join(baseDir, 'index.ts'), indexContent);
  writeFileSync(join(baseDir, 'routes.ts'), routesContent);
  writeFileSync(join(modelsDir, 'example.model.ts'), modelContent);
  writeFileSync(join(baseDir, 'swagger.ts'), swaggerContent);
  writeFileSync(join(validationDir, 'env.ts'), envContent);
  writeFileSync(join(baseDir, 'README.md'), readmeContent);

  // Update config.json
  const configPath = join(process.cwd(), 'src', 'plugins', 'config.json');
  let config: Record<string, PluginConfig> = {};
  
  if (existsSync(configPath)) {
    const configContent = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  }

  config[pluginName] = {
    enabled: false,
    config: {
      dbUri: `mongodb://localhost:27017/${pluginName}`,
      apiKey: 'your-api-key'
    }
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`✓ Generated plugin files in src/plugins/${pluginName}`);
  console.log('✓ Updated config.json (plugin is disabled by default)');
  console.log('\nTo enable the plugin:');
  console.log(`1. Add required environment variables to .env:`);
  console.log(`   ${pluginName.toUpperCase()}_DB_URI=mongodb://localhost:27017/${pluginName}`);
  console.log(`   ${pluginName.toUpperCase()}_API_KEY=your-api-key`);
  console.log('2. Set "enabled": true in src/plugins/config.json');
}

// Check if plugin name argument is provided
if (process.argv.length < 3) {
  console.error('Please provide a plugin name');
  console.error('Example: bun run generate-plugin my-plugin');
  process.exit(1);
}

const pluginName = process.argv[2].toLowerCase();
generatePluginFiles(pluginName);
