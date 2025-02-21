# MercadoPago Payment Plugin

This plugin integrates MercadoPago payment processing into the application.

## Setup

1. Configure environment variables in your `.env` file:

```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_SANDBOX=true  # or false for production
```

2. The plugin will be automatically loaded when the application starts.

## Usage

```typescript
import { PluginLoader } from '../../utils/plugin-loader';
import { IPaymentPlugin } from '../../types/plugin';

// Get the plugin instance
const pluginLoader = PluginLoader.getInstance();
const mercadopago = pluginLoader.getPlugin<IPaymentPlugin>('mercadopago');

// Process a payment
const result = await mercadopago?.processPayment(100, 'ARS', {
  customerId: 'customer_123',
  description: 'Test payment'
});

if (result?.success) {
  console.log(`Payment processed: ${result.transactionId}`);
}

// Check payment status
const status = await mercadopago?.getPaymentStatus(result?.transactionId || '');
console.log(`Payment status: ${status?.status}`);
```

## Features

1. **Payment Processing**
   - Process payments through MercadoPago
   - Automatic transaction tracking
   - Sandbox/Production mode support

2. **Webhook Integration**
   - Endpoint: `/api/v1/payments/mercadopago/webhook`
   - Automatically updates payment status
   - Handles payment.updated and payment.created events

3. **Automatic Status Updates**
   - Hourly cron job checks pending payment statuses
   - Handles webhook delivery failures
   - Updates payment records in database

4. **Database Integration**
   - Tracks all payment attempts
   - Stores transaction IDs and metadata
   - Maintains payment status history

## Error Handling

The plugin includes comprehensive error handling:

- Validates configuration before processing payments
- Logs all errors for debugging
- Returns clear error messages
- Gracefully handles missing credentials

## Models

The plugin uses the `MercadoPagoPayment` model to track payments:

```typescript
interface IPayment {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'mercadopago';
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

## Webhook Events

Configure your MercadoPago dashboard to send webhooks to:
```
https://your-domain.com/api/v1/payments/mercadopago/webhook
```

The webhook handler processes the following events:
- `payment.updated`: Updates payment status based on the new state
- `payment.created`: Creates or updates payment record

## Status Mapping

MercadoPago statuses are mapped to our system as follows:

- `approved` → `completed`
- `rejected` → `failed`
- `cancelled` → `failed`
- All other statuses → `pending`
