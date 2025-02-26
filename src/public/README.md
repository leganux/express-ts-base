# Authentication System Documentation

## Available Endpoints

### 1. Register with Email/Password
- **Endpoint**: `/api/v1/auth/register`
- **Method**: POST
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "name": "User Name"
}
```
- **Response**: Returns user data and authentication token

### 2. Login with Email/Password
- **Endpoint**: `/api/v1/auth/login-with-token`
- **Method**: POST
- **Body**:
```json
{
  "idToken": "firebase_id_token"
}
```
- **Process**:
  1. First authenticates with Firebase
  2. Gets ID token
  3. Sends token to backend for authentication
- **Response**: Returns user data and both custom and ID tokens

### 3. Google Sign In
- **Endpoint**: `/api/v1/auth/login-with-token`
- **Method**: POST
- **Body**:
```json
{
  "idToken": "firebase_id_token",
  "firstName": "Optional First Name",
  "lastName": "Optional Last Name"
}
```
- **Process**:
  1. Authenticates with Google through Firebase
  2. Gets ID token
  3. Sends token to backend with user info
- **Response**: Returns user data and both custom and ID tokens

### 4. Get Users List
- **Endpoint**: `/api/v1/users`
- **Method**: GET
- **Headers**: 
  - Authorization: Bearer {idToken}
- **Response**: Returns list of users

## Authentication Flow

### Email/Password Registration
1. Fill out registration form with email, password, and name
2. System creates user in Firebase
3. System creates user in local database
4. Verification email is sent if email is not verified
5. User data and tokens are returned

### Email/Password Login
1. Enter email and password
2. Firebase authenticates credentials
3. System gets ID token
4. Backend validates token and checks database
5. User data and tokens are returned

### Google Sign In
1. Click "Sign in with Google" button
2. Complete Google authentication
3. Firebase provides user info and ID token
4. Backend creates/updates user in database
5. User data and tokens are returned

## Important Notes

- For protected API endpoints, use the ID token in the Authorization header
- Email verification status is checked on login
- Unverified emails will automatically receive verification links
- Google-authenticated users typically come with pre-verified emails
- The system maintains user data in both Firebase and local database

## Example Usage

### Protected API Request
```javascript
fetch('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
})
```

### Response Format
```json
{
  "error": null,
  "success": true,
  "message": "Success message",
  "code": 200,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "emailVerified": true
    },
    "token": "custom_token"
  }
}
```
