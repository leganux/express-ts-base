# Stripe Plugin

This plugin integrates Stripe payment processing functionality into your Express application. It provides a comprehensive set of features for handling payments, subscriptions, customers, and webhooks.

## Features

- Payment processing with Payment Intents
- Customer management
- Subscription handling
- Product and price management
- Webhook integration
- Refund processing
- Payment method management

## Installation

The plugin is automatically installed with the project dependencies. Make sure you have the following in your package.json:

```json
{
  "dependencies": {
    "stripe": "latest"
  }
}
```

## Configuration

1. Set up your environment variables in your .env file:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

2. Configure the plugin in your Express application:

```typescript
import express from 'express';
import stripeRoutes from './plugins/stripe/routes';

const app = express();

// Initialize Stripe routes
app.use('/api/stripe', stripeRoutes());
```

## API Endpoints

### Payment Intents

#### Create Payment Intent
```http
POST /api/stripe/payment-intents
```
Request body:
```json
{
  "amount": 1000,
  "currency": "usd",
  "metadata": {
    "orderId": "123"
  }
}
```

#### Retrieve Payment Intent
```http
GET /api/stripe/payment-intents/:id
```

#### Confirm Payment Intent
```http
POST /api/stripe/payment-intents/:id/confirm
```
Request body:
```json
{
  "paymentMethodId": "pm_..."
}
```

### Customers

#### Create Customer
```http
POST /api/stripe/customers
```
Request body:
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "userId": "123"
  }
}
```

#### Retrieve Customer
```http
GET /api/stripe/customers/:id
```

#### Update Customer
```http
PATCH /api/stripe/customers/:id
```
Request body:
```json
{
  "name": "New Name",
  "metadata": {
    "key": "value"
  }
}
```

### Payment Methods

#### Create Payment Method
```http
POST /api/stripe/payment-methods
```
Request body:
```json
{
  "type": "card",
  "data": {
    "card": {
      "token": "tok_..."
    }
  }
}
```

#### Attach Payment Method to Customer
```http
POST /api/stripe/payment-methods/:id/attach
```
Request body:
```json
{
  "customerId": "cus_..."
}
```

### Subscriptions

#### Create Subscription
```http
POST /api/stripe/subscriptions
```
Request body:
```json
{
  "customerId": "cus_...",
  "priceId": "price_...",
  "metadata": {
    "planName": "Premium"
  }
}
```

#### Retrieve Subscription
```http
GET /api/stripe/subscriptions/:id
```

#### Cancel Subscription
```http
DELETE /api/stripe/subscriptions/:id
```

### Products and Prices

#### Create Product
```http
POST /api/stripe/products
```
Request body:
```json
{
  "name": "Premium Plan",
  "description": "Premium subscription plan",
  "metadata": {
    "features": "unlimited"
  }
}
```

#### Create Price
```http
POST /api/stripe/prices
```
Request body:
```json
{
  "productId": "prod_...",
  "unitAmount": 1000,
  "currency": "usd",
  "recurring": {
    "interval": "month"
  }
}
```

### Refunds

#### Create Refund
```http
POST /api/stripe/refunds
```
Request body:
```json
{
  "paymentIntentId": "pi_...",
  "amount": 1000
}
```

### Webhooks

The plugin includes webhook handling for various Stripe events. Configure your webhook endpoint in the Stripe dashboard to point to:

```
https://your-domain.com/api/stripe/webhooks
```

Supported webhook events:
- payment_intent.succeeded
- payment_intent.payment_failed
- customer.subscription.deleted
- customer.subscription.updated

## Example Usage

### Creating a Payment

```typescript
// Frontend
const response = await fetch('/api/stripe/payment-intents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000, // Amount in cents
    currency: 'usd'
  })
});

const { client_secret } = await response.json();

// Use client_secret with Stripe.js to complete the payment
const stripe = Stripe('your_publishable_key');
const result = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: elements.getElement('card'),
    billing_details: {
      name: 'John Doe'
    }
  }
});
```

### Setting Up a Subscription

```typescript
// 1. Create a customer
const customerResponse = await fetch('/api/stripe/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    name: 'John Doe'
  })
});
const customer = await customerResponse.json();

// 2. Create a subscription
const subscriptionResponse = await fetch('/api/stripe/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: customer.id,
    priceId: 'price_...'
  })
});
const subscription = await subscriptionResponse.json();
```

## Error Handling

The plugin includes comprehensive error handling:

- All API endpoints return appropriate error status codes and messages
- Webhook signature verification
- Payment processing error handling
- Network and API error handling

## Security Considerations

- Use environment variables for sensitive keys
- Implement proper authentication for your endpoints
- Validate webhook signatures
- Use HTTPS in production
- Keep your Stripe library updated
- Monitor your Stripe dashboard for suspicious activity

## Webhook Testing

For local development, you can use the Stripe CLI to test webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This will provide you with a webhook signing secret that you can use in your local environment.
