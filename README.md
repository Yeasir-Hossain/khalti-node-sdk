# Khalti Payment Gateway SDK for Node.js

[![npm version](https://img.shields.io/npm/v/khalti-node-sdk.svg)](https://www.npmjs.com/package/khalti-node-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript SDK for integrating with the Khalti Payment Gateway in Node.js applications.

## Features

- TypeScript support with full type definitions
- Promise-based API
- Comprehensive error handling
- Debug mode for development
- Supports all Khalti payment operations (E-Banking, Mobile Banking, Khalti Wallet)
- Bank listing functionality
- Full and partial refund support
- Framework agnostic (works with Express, Next.js, etc.)

## Installation

\`\`\`bash
npm install khalti-node-sdk
# or
yarn add khalti-node-sdk
# or
pnpm add khalti-node-sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { KhaltiClient } from 'khalti-node-sdk';

// Initialize the client
const khalti = new KhaltiClient({
  apiKey: 'your-api-key-here',
  debug: true, // Enable debug logging (optional)
  isLive: true, // Use production environment (optional, defaults to false)
});

// Initiate a payment
async function initiatePayment() {
  try {
    const response = await khalti.initiatePayment({
      purchase_order_id: 'order-123',
      amount: 10000, // 100 NPR (in paisa)
      return_url: 'https://yourwebsite.com/payment/success',
      website_url: 'https://yourwebsite.com',
      purchase_order_name: 'Premium Subscription',
      customer_info: {
        name: "John Doe",
        email: "john@example.com",
        phone: "9801234567"
      },
    });

    console.log('Payment URL:', response.payment_url);
    console.log('Payment ID:', response.pidx);
    
    // Redirect user to response.payment_url
  } catch (error) {
    console.error('Payment initiation failed:', error);
  }
}

// Verify a payment
async function verifyPayment(pidx) {
  try {
    const response = await khalti.verifyPayment({ pidx });
    
    console.log('Payment status:', response.status);
    console.log('Transaction ID:', response.transaction_id);
    
    return response;
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
}

// Process a refund
async function refundPayment(mobileNumber) {
  try {
    // For full refund
    const fullRefundResponse = await khalti.refundPayment({ 
      mobile: mobileNumber 
    });
    
    console.log('Full refund processed:', fullRefundResponse);
    
    // For partial refund
    const partialRefundResponse = await khalti.refundPayment({ 
      mobile: mobileNumber,
      amount: 5000 // 50 NPR
    });
    
    console.log('Partial refund processed:', partialRefundResponse);
  } catch (error) {
    console.error('Refund failed:', error);
  }
}
\`\`\`

## API Reference

### Initialization

\`\`\`typescript
const khalti = new KhaltiClient({
  apiKey: string,       // Required: Your Khalti API key
  baseUrl?: string,     // Optional: Custom API base URL
  debug?: boolean,      // Optional: Enable debug logging
  isLive?: boolean,     // Optional: Use production environment (defaults to false)
});
\`\`\`

### Methods

#### getBanks(paymentType)

Gets a list of banks for a specific payment type.

\`\`\`typescript
const banks = await khalti.getBanks("ebanking"); // For e-banking
// OR
const mobileBanks = await khalti.getBanks("mobilecheckout"); // For mobile banking
\`\`\`

Returns:
\`\`\`typescript
{
  total_pages: number,
  total_records: number,
  next: string | null,
  previous: string | null,
  record_range: [number, number],
  current_page: number,
  records: [
    {
      idx: string,            // Bank ID
      name: string,           // Full name of the bank
      short_name: string,     // Short name or abbreviation
      logo: string,           // URL to bank logo
      swift_code: string,
      has_cardpayment: boolean,
      address: string,
      ebanking_url: string,
      has_ebanking: boolean,
      has_mobile_checkout: boolean,
      has_direct_withdraw: boolean,
      has_nchl: boolean,
      has_mobile_banking: boolean,
      play_store: string,
      app_store: string,
      branches: any[]
    },
    // ...more banks
  ]
}
\`\`\`

#### initiatePayment(params)

Initiates a payment request to Khalti.

\`\`\`typescript
const response = await khalti.initiatePayment({
  purchase_order_id: string,    // Required: Unique identifier for the purchase order
  amount: number,               // Required: Amount in paisa (100 paisa = 1 NPR)
  return_url: string,           // Required: URL to redirect after payment completion
  website_url: string,          // Required: Your website URL
  purchase_order_name?: string, // Optional: Purchase details
  customer_info?: {             // Optional: Customer information
    name?: string,
    email?: string,
    phone?: string,
  },
  amount_breakdown?: Array<{    // Optional: Breakdown of the amount
    label: string,
    amount: number,
  }>,
  product_details?: Array<{     // Optional: Product details
    identity: string,
    name: string,
    total_price: number,
    quantity: number,
    unit_price: number,
  }>,
  merchant_username?: string,   // Optional: Merchant username
  merchant_extra?: string,      // Optional: Additional merchant data
  ttl?: number,                 // Optional: Time to live in seconds
  bank?: string,                // Optional: Bank identifier (from getBanks)
  modes?: Array<"MOBILE_BANKING" | "CONNECT_IPS" | "SCT" | "KHALTI" | "E_BANKING">, // Optional: Payment modes
});
\`\`\`

Returns:
\`\`\`typescript
{
  payment_url: string,      // URL to redirect the user to for payment
  pidx: string,             // Unique identifier for the payment
  purchase_order_id: string,  // Purchase order ID
  expires_at: string,       // Expiration timestamp
  expires_in: number,       // Expiration time in seconds
}
\`\`\`

#### verifyPayment(params)

Verifies a payment after completion.

\`\`\`typescript
const response = await khalti.verifyPayment({
  pidx: string,  // Required: Payment transaction ID
});
\`\`\`

Returns:
\`\`\`typescript
{
  status: "Initiated" | "Pending" | "Completed" | "Failed" | "Refunded" | "Expired" | "User canceled" | "Partially Refunded",
  total_amount: number,   // Amount in paisa
  transaction_id: string,  // Transaction ID
  fee: number,            // Transaction fee
  refunded: boolean,      // Whether the payment was refunded
}
\`\`\`

#### checkPaymentStatus(pidx)

Checks the status of a payment.

\`\`\`typescript
const response = await khalti.checkPaymentStatus(pidx);
\`\`\`

Returns:
\`\`\`typescript
{
  status: "Initiated" | "Pending" | "Completed" | "Failed" | "Refunded" | "Expired" | "User canceled" | "Partially Refunded",
  purchase_order_id: string,  // Purchase order ID
  pidx: string,             // Payment transaction ID
  amount: number,           // Amount in paisa
  createdAt: string,        // Created timestamp
  updatedAt: string,        // Updated timestamp
}
\`\`\`

#### refundPayment(params)

Processes a full or partial refund.

\`\`\`typescript
// For full refund
const fullRefundResponse = await khalti.refundPayment({
  mobile: string,  // Required: Mobile number associated with the Khalti account
});

// For partial refund
const partialRefundResponse = await khalti.refundPayment({
  mobile: string,  // Required: Mobile number associated with the Khalti account
  amount: number,  // Required for partial refund: Amount to refund in paisa
});
\`\`\`

Returns:
\`\`\`typescript
{
  status: string,             // Status of the refund (e.g., "Refunded", "Partially Refunded")
  transactionId: string,      // Transaction ID
  refunded_amount: number,    // Total amount refunded in paisa
  remaining_amount?: number,  // Remaining amount (for partial refunds) in paisa
  refunded_at: string,        // Refund timestamp
}
\`\`\`

### Error Handling

The SDK throws `KhaltiError` for all errors, which includes:

- `code`: Error code or key
- `message`: Error message
- `statusCode`: HTTP status code

Example:

\`\`\`typescript
import { KhaltiClient, KhaltiError, ErrorCode } from 'khalti-node-sdk';

try {
  const response = await khalti.initiatePayment({
    // ...params
  });
} catch (error) {
  if (error instanceof KhaltiError) {
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Status: ${error.statusCode}`);
    
    // Handle specific error types
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        // Handle validation errors
        break;
      case ErrorCode.AUTHENTICATION_ERROR:
        // Handle authentication errors
        break;
      // ...other error types
    }
  }
}
\`\`\`

## Framework Integration Examples

### Express.js

\`\`\`typescript
import express from 'express';
import { KhaltiClient, KhaltiError } from 'khalti-node-sdk';

const app = express();
app.use(express.json());

const khalti = new KhaltiClient({
  apiKey: process.env.KHALTI_API_KEY,
  isLive: process.env.NODE_ENV === 'production',
});

// Get banks
app.get('/api/banks/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== 'ebanking' && type !== 'mobilecheckout') {
      return res.status(400).json({ error: 'Invalid bank type' });
    }
    
    const banks = await khalti.getBanks(type);
    
    res.json({
      success: true,
      banks: banks.records,
    });
  } catch (error) {
    if (error instanceof KhaltiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
    });
  }
});

// Initiate payment
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { amount, orderId, productName, bankId, paymentModes } = req.body;
    
    const response = await khalti.initiatePayment({
      purchase_order_id: orderId,
      amount: amount * 100, // Convert to paisa
      return_url: `${process.env.APP_URL}/payment/verify`,
      website_url: process.env.APP_URL,
      purchase_order_name: productName,
      bank: bankId,
      modes: paymentModes,
      customer_info: req.body.customerInfo,
    });
    
    res.json({
      success: true,
      paymentUrl: response.payment_url,
      pidx: response.pidx,
    });
  } catch (error) {
    if (error instanceof KhaltiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
    });
  }
});

// Refund endpoint
app.post('/api/payment/refund', async (req, res) => {
  try {
    const { mobile, amount } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    // Process refund (full or partial)
    const refundParams = amount ? { mobile, amount } : { mobile };
    const response = await khalti.refundPayment(refundParams);
    
    res.json({
      success: true,
      refund: response,
    });
  } catch (error) {
    if (error instanceof KhaltiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

## Advanced Usage

### Environment Selection

The SDK supports both production and sandbox environments:

\`\`\`typescript
// For production
const prodClient = new KhaltiClient({
  apiKey: 'your-live-api-key',
  isLive: true,
});

// For sandbox/testing
const testClient = new KhaltiClient({
  apiKey: 'your-test-api-key',
  isLive: false, // This is the default
});

// With custom base URL
const customClient = new KhaltiClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-khalti-url.com/api',
});
\`\`\`

### Bank Selection and Payment Modes

The SDK supports different payment modes and bank selection:

\`\`\`typescript
// First get available banks
const banks = await khalti.getBanks("ebanking");
const selectedBank = banks.records[0]; // Select first bank

// Initiate payment with bank selection and e-banking mode
const response = await khalti.initiatePayment({
  purchase_order_id: 'order-123',
  amount: 10000,
  return_url: 'https://example.com/return',
  website_url: 'https://example.com',
  purchase_order_name: 'Test Order',
  bank: selectedBank.idx,
  modes: ["E_BANKING"],
  customer_info: {
    name: "John Doe",
    email: "john@example.com",
    phone: "9801234567"
  }
});

// For mobile banking
const mobileBanks = await khalti.getBanks("mobilecheckout");
const selectedMobileBank = mobileBanks.records[0];

const mobileResponse = await khalti.initiatePayment({
  // ... other parameters
  bank: selectedMobileBank.idx,
  modes: ["MOBILE_BANKING"]
});
\`\`\`

### Refund Management

The SDK supports both full and partial refunds:

\`\`\`typescript
// Process a full refund
const fullRefund = await khalti.refundPayment({
  mobile: '9801234567',
});

// Process a partial refund
const partialRefund = await khalti.refundPayment({
  mobile: '9801234567',
  amount: 5000, // 50 NPR in paisa
});
\`\`\`

## Development

### Building the package

\`\`\`bash
npm run build
\`\`\`

### Running tests

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Khalti Payment Gateway](https://khalti.com/)
- [Axios](https://axios-http.com/)
