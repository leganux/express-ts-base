# Skydropx Plugin

This plugin integrates Skydropx shipping functionality into your Express application. It provides a comprehensive set of features for managing shipments, labels, tracking, and carrier information.

## Features

- Create and manage shipments
- Get shipping rates from multiple carriers
- Generate shipping labels
- Track shipments
- Manage carriers
- Cancel shipments
- Get shipment and label status

## Installation

The plugin is automatically installed with the project dependencies.

## Configuration

1. Set up your environment variables in your .env file:

```env
SKYDROPX_API_KEY=your_skydropx_api_key
```

2. Configure the plugin in your Express application:

```typescript
import express from 'express';
import skydropxRoutes from './plugins/skydropx/routes';

const app = express();

// Initialize Skydropx routes
app.use('/api/skydropx', skydropxRoutes());
```

## API Endpoints

### Create Shipment
```http
POST /api/skydropx/shipments
```
Request body:
```json
{
  "fromAddress": {
    "street1": "123 Sender St",
    "city": "Sender City",
    "province": "Sender State",
    "country": "MX",
    "zip": "12345",
    "name": "Sender Name",
    "phone": "1234567890",
    "email": "sender@example.com",
    "contents": "Products"
  },
  "toAddress": {
    "street1": "456 Receiver St",
    "city": "Receiver City",
    "province": "Receiver State",
    "country": "MX",
    "zip": "67890",
    "name": "Receiver Name",
    "phone": "0987654321",
    "email": "receiver@example.com",
    "contents": "Products"
  },
  "parcel": {
    "weight": 1.5,
    "height": 20,
    "width": 15,
    "length": 10
  },
  "consignmentNote": "MERCH"
}
```

### Get Shipping Rates
```http
GET /api/skydropx/shipments/:id/rates
```

### Create Label
```http
POST /api/skydropx/labels
```
Request body:
```json
{
  "rateId": "rate_id_here"
}
```

### Track Shipment
```http
GET /api/skydropx/tracking/:number
```

### Get Available Carriers
```http
GET /api/skydropx/carriers
```

### Get Shipment Details
```http
GET /api/skydropx/shipments/:id
```

### Cancel Shipment
```http
DELETE /api/skydropx/shipments/:id
```

### Get Label Status
```http
GET /api/skydropx/labels/:id
```

## Example Usage

### Creating a Shipment

```typescript
// Create a shipment
const shipmentResponse = await fetch('/api/skydropx/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromAddress: {
      street1: '123 Sender St',
      city: 'Sender City',
      province: 'Sender State',
      country: 'MX',
      zip: '12345',
      name: 'Sender Name',
      phone: '1234567890',
      email: 'sender@example.com',
      contents: 'Products'
    },
    toAddress: {
      street1: '456 Receiver St',
      city: 'Receiver City',
      province: 'Receiver State',
      country: 'MX',
      zip: '67890',
      name: 'Receiver Name',
      phone: '0987654321',
      email: 'receiver@example.com',
      contents: 'Products'
    },
    parcel: {
      weight: 1.5,
      height: 20,
      width: 15,
      length: 10
    },
    consignmentNote: 'MERCH'
  })
});

const shipment = await shipmentResponse.json();

// Get shipping rates
const ratesResponse = await fetch(`/api/skydropx/shipments/${shipment.id}/rates`);
const rates = await ratesResponse.json();

// Create label
const labelResponse = await fetch('/api/skydropx/labels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rateId: rates[0].id
  })
});
const label = await labelResponse.json();

// Track shipment
const trackingResponse = await fetch(`/api/skydropx/tracking/${label.tracking_number}`);
const tracking = await trackingResponse.json();
```

## Error Handling

The plugin includes comprehensive error handling:

- All API endpoints return appropriate error status codes and messages
- Network and API error handling
- Logging of errors and important operations

## Security Considerations

- Use environment variables for sensitive keys
- Implement proper authentication for your endpoints
- Use HTTPS in production
- Validate input data
- Monitor your Skydropx dashboard for suspicious activity

## Dimensions and Weight

- Weight should be provided in kilograms (KG)
- Dimensions (height, width, length) should be provided in centimeters (CM)
- Ensure accurate measurements to avoid shipping discrepancies

## Supported Countries

The plugin supports shipping within and between countries where Skydropx operates. Check the Skydropx documentation for the most up-to-date list of supported countries and carriers.

## Rate Calculation

Shipping rates are calculated based on:
- Package dimensions and weight
- Origin and destination addresses
- Selected carrier
- Service level
- Additional services requested

## Label Formats

Labels are generated in PDF format by default. The label includes:
- Shipping addresses
- Tracking number
- Carrier information
- Package details
- Barcode/QR code

## Tracking Updates

Tracking information includes:
- Current status
- Location history
- Estimated delivery date
- Any delivery exceptions
- Proof of delivery (when available)
