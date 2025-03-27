# Facturama Plugin

This plugin integrates with Facturama's API to generate and manage CFDI invoices from orders.

## Features

- Real-time invoice generation from orders
- Automatic catalog synchronization (tax regimes, payment forms, etc.)
- Invoice management (create, retrieve, cancel)
- PDF and XML invoice downloads
- Proper error handling and logging
- Firebase authentication integration

## Setup

1. Add the following environment variables to your `.env` file:

```env
# Facturama Configuration
FACTURAMA_USERNAME=your_facturama_username
FACTURAMA_PASSWORD=your_facturama_password
FACTURAMA_IS_SANDBOX=true  # Set to false for production
```

2. The plugin will automatically initialize with the application.

## API Endpoints

### Get Catalogs
```http
GET /api/v1/facturama/catalogs
```
Retrieves all Facturama catalogs including:
- Tax regimes
- Payment forms
- Payment methods
- Product services
- Units
- Currencies

### Create Invoice from Order
```http
POST /api/v1/facturama/invoices/order/:orderId
```
Generates a new invoice from an existing order.

### Get Invoice Details
```http
GET /api/v1/facturama/invoices/:invoiceId
```
Retrieves details of a specific invoice.

### Cancel Invoice
```http
DELETE /api/v1/facturama/invoices/:invoiceId
```
Cancels an existing invoice.

### List Invoices
```http
GET /api/v1/facturama/invoices
```
Retrieves a list of invoices, optionally filtered by user.

Query parameters:
- `userId` (optional): Filter invoices by user ID

## Models

### Invoice
```typescript
{
  order_id: ObjectId;      // Reference to Order
  user_id: ObjectId;       // Reference to User
  facturama_id: string;    // Facturama's internal ID
  facturama_uuid: string;  // Facturama's UUID
  total: number;           // Total amount with tax
  subtotal: number;        // Amount before tax
  tax: number;            // Tax amount
  status: 'active' | 'cancelled';
  pdf_url: string;        // URL to download PDF
  xml_url: string;        // URL to download XML
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The plugin includes comprehensive error handling:
- Environment validation
- API errors
- Database errors
- Missing or invalid data

All errors are properly logged using the application's logger.

## Security

- All endpoints require Firebase authentication
- Facturama credentials are validated on startup
- API calls use HTTPS
- Rate limiting is handled by Facturama

## Catalog Caching

Catalogs are cached for 24 hours to improve performance and reduce API calls. The cache includes:
- Tax regimes
- Payment forms
- Payment methods
- Product services
- Units
- Currencies

## Development

To run in sandbox mode:
1. Set `FACTURAMA_IS_SANDBOX=true` in your `.env`
2. Use test credentials from Facturama
3. Test invoices will not affect production

## Production

To switch to production:
1. Set `FACTURAMA_IS_SANDBOX=false` in your `.env`
2. Use production credentials from Facturama
3. Ensure proper error handling is in place
4. Monitor logs for any issues

## Dependencies

- axios: HTTP client
- zod: Environment validation
- mongoose: Database operations
- firebase-admin: Authentication
