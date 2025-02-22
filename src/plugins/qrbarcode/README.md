# QR/Barcode Plugin

This plugin provides functionality to generate QR codes and barcodes in base64 format.

## Features

- Generate QR codes from text
- Generate barcodes (CODE128 format) from text
- Returns base64 encoded images

## API Endpoints

### Generate QR Code
```http
POST /qrbarcode/qr
```

Request body:
```json
{
  "text": "Your text to encode in QR"
}
```

Response:
```json
{
  "data": "base64_encoded_qr_code_image"
}
```

### Generate Barcode
```http
POST /qrbarcode/barcode
```

Request body:
```json
{
  "text": "Your text to encode in barcode"
}
```

Response:
```json
{
  "data": "base64_encoded_barcode_image"
}
```

## Error Responses

- 400 Bad Request: When text is missing in request
- 500 Internal Server Error: When generation fails

## Database Schema

### QRCode Model
```typescript
{
  text: string;          // Text encoded in QR
  createdAt: Date;      // Generation timestamp
  type: 'qr';           // Type of code
  format: string;       // Image format (base64)
}
```

### Barcode Model
```typescript
{
  text: string;          // Text encoded in barcode
  createdAt: Date;      // Generation timestamp
  type: 'barcode';      // Type of code
  format: string;       // Image format (base64)
  barcodeType: string;  // Barcode format (CODE128)
}
```

## Dependencies

- qrcode: For QR code generation
- jsbarcode: For barcode generation
- canvas: For image manipulation
