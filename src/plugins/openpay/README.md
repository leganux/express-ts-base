# OpenPay Payment Plugin

This plugin integrates OpenPay payment and subscription processing into the application.

## Setup

1. Configure environment variables in your `.env` file:

```env
OPENPAY_MERCHANT_ID=your_merchant_id
OPENPAY_PRIVATE_KEY=your_private_key
OPENPAY_SANDBOX=true  # or false for production
```

2. The plugin will be automatically loaded when the application starts.

## Usage

### Payments

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

### Subscriptions

```typescript
// Create a customer
const customer = await openpay?.createCustomer(
  'customer@example.com',
  'John Doe',
  '+1234567890'
);

// Create a product
const product = await openpay?.createProduct(
  'Premium Plan',
  'Monthly subscription to premium features'
);

// Create a price for the product
const price = await openpay?.createPrice(
  product.productId,
  1000, // $10.00
  'MXN',
  { frequency: 'monthly', interval: 1 }
);

// Create a subscription
const subscription = await openpay?.createSubscription(
  customer.customerId,
  price.priceId,
  1000,
  'MXN'
);

// Cancel a subscription
await openpay?.cancelSubscription(subscription.subscriptionId);
```

## Features

1. **Payment Processing**
   - Process payments through OpenPay
   - Automatic transaction tracking
   - Sandbox/Production mode support

2. **Subscription Management**
   - Create and manage subscription plans
   - Customer management
   - Automatic subscription renewal
   - Flexible pricing options
   - Subscription status tracking

3. **Product Management**
   - Create and manage products
   - Multiple pricing tiers
   - Support for recurring billing
   - Active/inactive product states

4. **Customer Management**
   - Create and update customers
   - Store customer information
   - Link customers to subscriptions
   - Track customer payment methods

5. **Webhook Integration**
   - Endpoint: `/api/v1/payments/openpay/webhook`
   - Handles payment and subscription events
   - Automatic status updates
   - Event logging and tracking

6. **Automatic Updates**
   - Hourly cron job for payment status checks
   - Daily cron job for subscription renewals
   - Handles webhook delivery failures
   - Updates records in database

7. **Database Integration**
   - Tracks all payments and subscriptions
   - Stores customer information
   - Maintains product and price catalogs
   - Records webhook events

## Error Handling

The plugin includes comprehensive error handling:

- Validates configuration before operations
- Logs all errors for debugging
- Returns clear error messages
- Gracefully handles missing credentials

## Models

The plugin uses the following models:

### Payment Model
```typescript
interface IPayment {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subscription Model
```typescript
interface ISubscription {
  subscriptionId: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'pending';
  planId: string;
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  metadata: any;
}
```

### Product Model
```typescript
interface IProduct {
  productId: string;
  name: string;
  description?: string;
  active: boolean;
  prices: IPrice[];
  metadata: any;
}
```

### Customer Model
```typescript
interface ICustomer {
  customerId: string;
  email: string;
  name?: string;
  phone?: string;
  defaultPaymentMethod?: string;
  metadata: any;
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
- `subscription.created`: Records new subscription
- `subscription.updated`: Updates subscription details
- `subscription.cancelled`: Marks subscription as canceled

## API Documentation

The plugin provides a complete REST API with Swagger documentation. Access the Swagger UI at:
```
/api-docs
```

Available endpoints:
- `/api/openpay/payments`: Payment processing
- `/api/openpay/customers`: Customer management
- `/api/openpay/subscriptions`: Subscription operations
- `/api/openpay/products`: Product management
- `/api/openpay/prices`: Price management
- `/api/openpay/webhooks`: Webhook handling
