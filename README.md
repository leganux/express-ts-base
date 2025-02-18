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
