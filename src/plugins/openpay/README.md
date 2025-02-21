# OpenPay Payment Plugin

This plugin integrates OpenPay payment processing into the application.

## Setup

1. Configure environment variables in your `.env` file:

```env
OPENPAY_MERCHANT_ID=your_merchant_id
OPENPAY_PRIVATE_KEY=your_private_key
OPENPAY_SANDBOX=true  # or false for production
```

2. The plugin will be automatically loaded when the application starts.

## Usage

```typescript
import { PluginLoader } from '../../utils/plugin-loader';
import { IPaymentPlugin } from '../../types/plugin';

// Get the plugin instance
const pluginLoader = PluginLoader.getInstance();
const openpay = pluginLoader.getPlugin<IPaymentPlugin>('openpay');

// Process a payment
const result = await openpay?.processPayment(100, 'MXN', {
  customerId: 'customer_123',
  description: 'Test payment'
});

if (result?.success) {
  console.log(`Payment processed: ${result.transactionId}`);
}

// Check payment status
const status = await openpay?.getPaymentStatus(result?.transactionId || '');
console.log(`Payment status: ${status?.status}`);
```

## Features

1. **Payment Processing**
   - Process payments through OpenPay
   - Automatic transaction tracking
   - Sandbox/Production mode support

2. **Webhook Integration**
   - Endpoint: `/api/v1/payments/openpay/webhook`
   - Automatically updates payment status
   - Handles charge.succeeded and charge.failed events

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

The plugin uses the `OpenPayPayment` model to track payments:

```typescript
interface IPayment {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'openpay';
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

## Webhook Events

Configure your OpenPay dashboard to send webhooks to:
```
https://your-domain.com/api/v1/payments/openpay/webhook
```

The webhook handler processes the following events:
- `charge.succeeded`: Updates payment status to 'completed'
- `charge.failed`: Updates payment status to 'failed'
