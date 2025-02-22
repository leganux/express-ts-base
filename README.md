# Express TypeScript API with Firebase Authentication

A TypeScript-based Express.js API using Apiato, MongoDB, and Firebase Authentication with role-based access control.

## Features

### Authentication
- Email/Password registration and login
- Google Sign-in integration
- Password reset functionality
- Token-based authentication
- Role-based access control (RBAC)

### User Roles
- **Admin**: Full system access, can manage user roles
- **User**: Standard authenticated user access
- **Public**: Limited access to public endpoints

### Security
- Firebase Authentication integration
- JWT token validation
- Role-based middleware protection
- CORS enabled
- Environment variable validation

## Prerequisites

- Node.js (v18 or higher)
- Bun.js
- MongoDB
- Firebase project with Authentication enabled

## Environment Variables

Create a `.env` file in the root directory:

```env
# Application Environment
NODE_ENV=development
PORT=3001

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/apiato-demo

# Logging Configuration
LOG_LEVEL=debug

# Firebase Web Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Admin Configuration
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google Sign-in
```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer your-token
```

### Role Management (Admin Only)

#### Set User Role
```http
POST /api/auth/set-role
Authorization: Bearer admin-token
Content-Type: application/json

{
  "uid": "user-firebase-uid",
  "role": "admin" | "user" | "public"
}
```

## Authentication Flow

1. **Registration**:
   - User registers with email/password or Google
   - Firebase creates authentication record
   - System creates user document in MongoDB
   - Default role (USER) is assigned

2. **Login**:
   - User authenticates with credentials
   - Firebase validates credentials
   - System generates custom token
   - User receives token for API access

3. **Protected Routes**:
   - Client includes token in Authorization header
   - Middleware validates token
   - Role-based access control enforced

## Role-Based Access Control

### Admin Role
- Full system access
- Can manage user roles
- Access to administrative endpoints

### User Role
- Standard authenticated access
- Personal profile management
- Access to protected endpoints

### Public Role
- Limited access
- Public endpoints only
- No administrative capabilities

## Security Considerations

- All passwords are handled by Firebase Authentication
- JWT tokens are validated on every request
- Role-based middleware protects sensitive endpoints
- Environment variables are validated at startup
- CORS is configured for security
- Request logging for audit trails

## Error Handling

The API uses a standardized error response format:

```json
{
  "error": "Error description",
  "success": false,
  "message": "User-friendly message",
  "code": 400,
  "data": {}
}
```

## Logging

The system uses Winston for logging with the following levels:
- error: System errors and exceptions
- warn: Warning conditions
- info: General operational information
- http: HTTP request logging
- debug: Detailed debugging information

Logs are stored in:
- `logs/error.log`: Error-level logs
- `logs/all.log`: All logs

## Development

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start

## Module Generator

The project includes a module generator script that automatically creates a complete CRUD module based on a schema file. This tool helps maintain consistency and reduces boilerplate code.

### Usage

```bash
# Generate a new module from a schema file
bun run generate:module src/modules/your-module/model.ts
```

### Generated Files

The script generates the following files in your module directory:
- `controller.ts`: Controller with custom operations
- `routes.ts`: Routes with apiato CRUD operations
- `swagger.ts`: Complete swagger documentation

### Example Schema

Create your model file (e.g., `src/modules/products/model.ts`):

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock?: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema({
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  }
}, {
  timestamps: true
});

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
```

Then run:
```bash
bun run generate:module src/modules/products/model.ts
```

This will generate:
1. A controller with custom operations
2. Routes with all apiato operations (CRUD + advanced queries)
3. Swagger documentation for all endpoints

### Generated Features

Each generated module includes:
- Complete CRUD operations using apiato
- Authentication middleware
- Role-based access control
- Advanced query operations:
  - Pagination
  - Filtering
  - Sorting
  - Field selection
  - Population
- Custom operations example
- Comprehensive swagger documentation

## Socket Generator

The project includes a socket generator that creates real-time WebSocket functionality for your modules using Socket.IO.

### Usage

```bash
# Generate socket implementation for a module
bun run generate:socket src/modules/your-module/model.ts
```

### Generated Files

The script generates the following files in your module directory:
- `socket.ts`: Socket.IO implementation with CRUD operations
- `socket-init.ts`: Socket server initialization
- `socket-test.ts`: Example client implementation

### Features

Each generated socket implementation includes:
- Complete CRUD operations over WebSocket
- Real-time updates
- Room-based broadcasting
- Permission middleware
- Error handling
- Connection management
- TypeScript support

### Example Usage

After generating the socket implementation:

1. Initialize the socket server in your module:
```typescript
import { initializeUserSockets } from './socket-init';

// In your Express app setup
const server = http.createServer(app);
initializeUserSockets(server);
```

2. Connect from the client:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/socket/your-module'
});

// Get all items
socket.emit('getMany', JSON.stringify({
  query: {
    select: { field1: 1, field2: 1 }
  }
}));

// Listen for response
socket.on('getMany:response', (response) => {
  console.log('Items retrieved:', response);
});
```

## Plugin System

The project includes a plugin system that allows you to extend the API's functionality. Plugins are automatically loaded from the `src/plugins` directory.

### Generating a New Plugin

The project includes a plugin generator script that creates a complete plugin structure with database support:

```bash
# Generate a new plugin
bun run generate:plugin my-plugin
```

This will create:
1. Basic plugin structure in `src/plugins/my-plugin/`
2. Database connection setup
3. Example model and routes
4. Environment validation
5. Swagger documentation
6. Plugin configuration (disabled by default)

The generated plugin includes:
- Separate database connection
- Authentication middleware
- Role-based access control
- Environment variable validation
- API documentation
- Example CRUD operations

### Creating a Plugin Manually

1. Create a new directory in `src/plugins` with your plugin name:
```bash
mkdir src/plugins/my-plugin
```

2. Create the required files:
```
src/plugins/my-plugin/
  ├── index.ts         # Plugin entry point
  ├── routes.ts        # Plugin routes
  ├── README.md        # Plugin documentation
  ├── swagger.ts       # Swagger documentation
  ├── validation/      # Validation schemas
  │   └── env.ts      # Environment variables validation
  └── models/         # Plugin models
      └── example.model.ts
```

3. Plugin Entry Point (`index.ts`):
```typescript
import { Router } from 'express';
import { z } from 'zod';
import routes from './routes';

// Plugin configuration type
export interface PluginConfig {
  apiKey?: string;
  endpoint?: string;
  // Add other configuration options
}

// Plugin class must implement Plugin interface
export class MyPlugin implements Plugin {
  public name = 'my-plugin';
  public version = '1.0.0';
  public routes: Router;
  private config: PluginConfig;

  constructor(config: PluginConfig = {}) {
    this.config = config;
    this.routes = routes;
  }

  // Initialize plugin
  async init(): Promise<void> {
    // Initialization logic
    console.log('MyPlugin initialized');
  }

  // Cleanup when plugin is disabled
  async destroy(): Promise<void> {
    // Cleanup logic
    console.log('MyPlugin destroyed');
  }
}

// Environment variables validation schema
export const envSchema = z.object({
  MY_PLUGIN_API_KEY: z.string().optional(),
  MY_PLUGIN_ENDPOINT: z.string().url().optional()
});

// Default export must be the plugin class
export default MyPlugin;
```

4. Plugin Routes (`routes.ts`):
```typescript
import { Router } from 'express';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';

const router = Router();

// Apply authentication middleware
router.use(validateFirebaseToken);

// Define routes
router.get('/', roleGuard([UserRole.ADMIN]), async (req, res) => {
  res.json({
    error: {},
    success: true,
    message: 'Plugin endpoint',
    code: 200,
    data: {}
  });
});

export default router;
```

5. Swagger Documentation (`swagger.ts`):
```typescript
export const myPluginSwaggerDocs = `
/**
 * @swagger
 * /api/v1/my-plugin:
 *   get:
 *     tags:
 *       - MyPlugin
 *     summary: Example endpoint
 *     description: Plugin endpoint description
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
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
 *                   type: object
 */`;
```

6. Environment Validation (`validation/env.ts`):
```typescript
import { z } from 'zod';

export const schema = z.object({
  MY_PLUGIN_API_KEY: z.string().optional(),
  MY_PLUGIN_ENDPOINT: z.string().url().optional()
});
```

### Enabling the Plugin

1. Add plugin configuration to `src/plugins/config.json`:
```json
{
  "my-plugin": {
    "enabled": true,
    "config": {
      "apiKey": "optional-api-key",
      "endpoint": "https://api.example.com"
    }
  }
}
```

2. Add environment variables to `.env`:
```env
MY_PLUGIN_API_KEY=your-api-key
MY_PLUGIN_ENDPOINT=https://api.example.com
```

### Plugin Features

Your plugin can include:
- Custom routes and controllers
- Database models
- Middleware
- External API integrations
- Custom swagger documentation
- Environment variable validation
- Initialization and cleanup logic

### Best Practices

1. **Naming Convention**: Use kebab-case for plugin directory names
2. **Documentation**: Include a README.md with:
   - Plugin description
   - Installation instructions
   - Configuration options
   - API endpoints
   - Usage examples

3. **Environment Variables**:
   - Prefix with plugin name (e.g., MY_PLUGIN_*)
   - Include validation schema
   - Document all variables

4. **Error Handling**:
   - Use standard API error format
   - Include proper error codes
   - Provide meaningful error messages

5. **Security**:
   - Use authentication middleware
   - Implement role-based access
   - Validate all inputs

6. **Testing**:
   - Include unit tests
   - Test initialization/destruction
   - Test configuration validation
