# Envia.com Plugin

This plugin integrates Envia.com shipping functionality into your Express application. It provides a comprehensive set of features for managing shipments, labels, tracking, and carrier information.

## Features

- Get shipping rates from multiple carriers
- Create and manage shipments
- Generate shipping labels
- Track shipments
- Get insurance quotes
- Schedule and manage pickups
- Get carrier information

## Installation

The plugin is automatically installed with the project dependencies.

## Configuration

1. Set up your environment variables in your .env file:

```env
ENVIACOM_API_KEY=your_enviacom_api_key
```

2. Configure the plugin in your Express application:

```typescript
import express from 'express';
import enviacomRoutes from './plugins/enviacom/routes';

const app = express();

// Initialize Envia.com routes
app.use('/api/enviacom', enviacomRoutes());
```

## API Endpoints

### Get Shipping Rates
```http
POST /api/enviacom/rates
```
Request body:
```json
{
  "origin": {
    "name": "Sender Name",
    "email": "sender@example.com",
    "phone": "1234567890",
    "street": "123 Main St",
    "number": "45",
    "district": "Downtown",
    "city": "Mexico City",
    "state": "CDMX",
    "country": "MX",
    "postalCode": "12345"
  },
  "destination": {
    "name": "Receiver Name",
    "email": "receiver@example.com",
    "phone": "0987654321",
    "street": "456 Oak St",
    "number": "78",
    "district": "Uptown",
    "city": "Guadalajara",
    "state": "JAL",
    "country": "MX",
    "postalCode": "67890"
  },
  "packages": [
    {
      "content": "Electronics",
      "amount": 1,
      "type": "box",
      "weight": 2.5,
      "weightUnit": "kg",
      "lengthUnit": "cm",
      "dimensions": {
        "length": 30,
        "width": 20,
        "height": 15
      }
    }
  ]
}
```

### Create Shipment
```http
POST /api/enviacom/shipments
```
Request body:
```json
{
  "origin": {
    // Same as rates endpoint
  },
  "destination": {
    // Same as rates endpoint
  },
  "packages": [
    // Same as rates endpoint
  ],
  "carrier": "fedex",
  "service": "express"
}
```

### Track Shipment
```http
GET /api/enviacom/tracking/:number
```

### Get Available Carriers
```http
GET /api/enviacom/carriers
```

### Generate Label
```http
GET /api/enviacom/labels/:shipmentId
```

### Get Insurance Quote
```http
POST /api/enviacom/insurance/quote
```
Request body:
```json
{
  "declaredValue": 1000,
  "carrier": "fedex"
}
```

### Get Pickup Availability
```http
POST /api/enviacom/pickup/availability
```
Request body:
```json
{
  "address": {
    // Same format as origin/destination
  },
  "carrier": "fedex",
  "date": "2025-02-22"
}
```

### Schedule Pickup
```http
POST /api/enviacom/pickup
```
Request body:
```json
{
  "address": {
    // Same format as origin/destination
  },
  "carrier": "fedex",
  "date": "2025-02-22",
  "timeWindow": "09:00-12:00",
  "shipmentIds": ["ship_123", "ship_456"]
}
```

### Cancel Pickup
```http
DELETE /api/enviacom/pickup/:id
```

## Example Usage

### Creating a Shipment

```typescript
// Get shipping rates
const ratesResponse = await fetch('/api/enviacom/rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: {
      name: 'Sender Name',
      email: 'sender@example.com',
      phone: '1234567890',
      street: '123 Main St',
      number: '45',
      district: 'Downtown',
      city: 'Mexico City',
      state: 'CDMX',
      country: 'MX',
      postalCode: '12345'
    },
    destination: {
      name: 'Receiver Name',
      email: 'receiver@example.com',
      phone: '0987654321',
      street: '456 Oak St',
      number: '78',
      district: 'Uptown',
      city: 'Guadalajara',
      state: 'JAL',
      country: 'MX',
      postalCode: '67890'
    },
    packages: [{
      content: 'Electronics',
      amount: 1,
      type: 'box',
      weight: 2.5,
      weightUnit: 'kg',
      lengthUnit: 'cm',
      dimensions: {
        length: 30,
        width: 20,
        height: 15
      }
    }]
  })
});

const rates = await ratesResponse.json();

// Create shipment with selected rate
const shipmentResponse = await fetch('/api/enviacom/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Same data as rates request
    carrier: rates[0].carrier,
    service: rates[0].service
  })
});

const shipment = await shipmentResponse.json();

// Generate label
const labelResponse = await fetch(`/api/enviacom/labels/${shipment.id}`);
const label = await labelResponse.json();

// Track shipment
const trackingResponse = await fetch(`/api/enviacom/tracking/${shipment.tracking_number}`);
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
- Monitor your Envia.com dashboard for suspicious activity

## Dimensions and Weight

- Weight can be provided in kilograms (kg) or pounds (lb)
- Dimensions can be provided in centimeters (cm) or inches (in)
- Ensure accurate measurements to avoid shipping discrepancies

## Supported Countries

The plugin supports shipping within and between countries where Envia.com operates. Check the Envia.com documentation for the most up-to-date list of supported countries and carriers.

## Rate Calculation

Shipping rates are calculated based on:
- Package dimensions and weight
- Origin and destination addresses
- Selected carrier
- Service level
- Additional services requested
- Insurance (if applicable)

## Label Formats

Labels are generated in PDF format and include:
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

## Pickup Services

- Schedule pickups with flexible time windows
- Multiple shipments can be included in a single pickup
- Availability varies by carrier and location
- Cancellation policies vary by carrier
