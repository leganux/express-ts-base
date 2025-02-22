# WhatsApp Plugin

This plugin integrates WhatsApp functionality into your Express application using the @whiskeysockets/baileys library. It provides REST API endpoints for WhatsApp operations and real-time updates through Socket.IO events.

## Features

- QR Code generation for WhatsApp Web authentication
- Real-time message handling
- Support for various media types (images, videos, audio, stickers)
- Automatic media file storage (local or AWS S3)
- Chat and message history access
- Socket.IO integration for real-time events

## Installation

1. The plugin is automatically installed with the project dependencies. Make sure you have the following in your package.json:

```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "latest",
    "qrcode-terminal": "latest",
    "socket.io": "latest",
    "@hapi/boom": "latest"
  }
}
```

2. Configure your storage settings in your environment variables:
```env
# For AWS S3 Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name

# For Local Storage
FILE_STORAGE_TYPE=local
FILE_UPLOAD_PATH=uploads
```

## Integration

1. Import and initialize the plugin in your Express application:

```typescript
import express from 'express';
import { createServer } from 'http';
import whatsappRoutes from './plugins/whatsapp/routes';

const app = express();
const server = createServer(app);

// Initialize WhatsApp routes
app.use('/api/whatsapp', whatsappRoutes(server));
```

## API Endpoints

### QR Code Display
```http
GET /api/whatsapp/qr
```
Displays a web page with the WhatsApp Web QR code for authentication. This endpoint provides a user-friendly interface for scanning the QR code with your WhatsApp mobile app.

### Status Check
```http
GET /api/whatsapp/status
```
Returns the connection status of the WhatsApp client.

### Get All Chats
```http
GET /api/whatsapp/chats
```
Returns a list of all WhatsApp chats.

### Get Chat Messages
```http
GET /api/whatsapp/messages/:jid
```
Returns messages from a specific chat. The `jid` parameter is the WhatsApp ID of the chat.

### Send Message
```http
POST /api/whatsapp/send
```
Send a message to a WhatsApp contact.

Request body:
```json
{
  "to": "phone_number@s.whatsapp.net",
  "content": "Hello!",
  "type": "text|image|video|audio",
  "mediaPath": "optional_media_url"
}
```

## Socket.IO Events

The plugin emits the following Socket.IO events:

### Client -> Server Events
- `disconnect`: Emitted when a client disconnects from the socket

### Server -> Client Events
- `whatsapp:qr`: Emitted when a new QR code is available for scanning
  ```typescript
  socket.on('whatsapp:qr', (qr: string) => {
    // Handle QR code
  });
  ```

- `whatsapp:connected`: Emitted when WhatsApp connection is established
  ```typescript
  socket.on('whatsapp:connected', () => {
    // Handle connection success
  });
  ```

- `whatsapp:message`: Emitted when a new message is received
  ```typescript
  socket.on('whatsapp:message', (message: {
    from: string;
    type: string;
    content: string;
    mediaUrl?: string;
    timestamp: number;
  }) => {
    // Handle new message
  });
  ```

## Media Handling

The plugin automatically handles various types of media:

- Images (jpg)
- Videos (mp4)
- Audio (mp3)
- Stickers (webp)

Media files are stored either locally or in AWS S3 based on your configuration. The storage path is returned in the message object's `mediaUrl` field.

## Authentication Process

1. Start your server and ensure the WhatsApp plugin is enabled
2. Visit `/api/whatsapp/qr` in your browser to see the QR code
3. Open WhatsApp on your mobile device
4. Tap Menu or Settings and select WhatsApp Web
5. Point your phone camera at the QR code
6. Once authenticated, the server will maintain the session

## Example Usage

### Viewing QR Code
```typescript
// Open the QR code page in a browser
window.open('/api/whatsapp/qr', '_blank');
```

### Frontend Socket.IO Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://your-server:port');

// Listen for QR code
socket.on('whatsapp:qr', (qr) => {
  // Display QR code to user
  console.log('New QR code received:', qr);
});

// Listen for connection status
socket.on('whatsapp:connected', () => {
  console.log('WhatsApp connected!');
});

// Listen for new messages
socket.on('whatsapp:message', (message) => {
  console.log('New message:', message);
});
```

### Sending Messages with Media

```typescript
// Send text message
await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '1234567890@s.whatsapp.net',
    content: 'Hello!',
    type: 'text'
  })
});

// Send image message
await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '1234567890@s.whatsapp.net',
    content: 'Check this out!',
    type: 'image',
    mediaPath: 'https://example.com/image.jpg'
  })
});
```

## Error Handling

The plugin includes comprehensive error handling:

- Connection errors are automatically handled with reconnection attempts
- Media upload failures fallback to local storage
- API endpoints return appropriate error status codes and messages
- Socket connection errors are logged and handled gracefully

## Security Considerations

- The plugin uses WhatsApp's official client library
- Media files are stored securely either locally or in AWS S3
- Socket.IO connections can be configured with CORS restrictions
- Authentication credentials are stored locally in the `auth_info_baileys` directory
