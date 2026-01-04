# Node.js SDK for maib e-Commerce Checkout API

![maib e-Commerce Checkout](https://repository-images.githubusercontent.com/1127858391/176ca1f5-732b-4620-ae49-757909e36105)

* maib e-Commerce Checkout API docs: https://docs.maibmerchants.md/checkout
* GitHub project https://github.com/alexminza/maib-checkout-sdk-node
* NPM package https://www.npmjs.com/package/maib-checkout-sdk

## Installation
To easily install or upgrade to the latest release, use `npm`:

```shell
npm install maib-checkout-sdk
```

## Getting started
Import SDK:

```javascript
const {
    MaibCheckoutSdk,
    MaibCheckoutApiRequest
} = require('maib-checkout-sdk');
```

Add project configuration:

```javascript
const MAIB_CHECKOUT_CLIENT_ID = process.env.MAIB_CHECKOUT_CLIENT_ID;
const MAIB_CHECKOUT_CLIENT_SECRET = process.env.MAIB_CHECKOUT_CLIENT_SECRET;
const MAIB_CHECKOUT_SIGNATURE_KEY = process.env.MAIB_CHECKOUT_SIGNATURE_KEY;
```

## SDK usage examples
### Get Access Token with Client ID and Client Secret

```javascript
const maibCheckoutApiRequest = MaibCheckoutApiRequest.create(MaibCheckoutSdk.SANDBOX_BASE_URL);
const maibCheckoutAuth = await maibCheckoutApiRequest.generateToken(MAIB_CHECKOUT_CLIENT_ID, MAIB_CHECKOUT_CLIENT_SECRET);
const maibCheckoutToken = maibCheckoutAuth.accessToken;
```

### Register a new hosted checkout session

```javascript
const maibCheckoutData = {
    'amount': 50.61,
    'currency': 'MDL',
    'orderInfo': {
        'id': 'EK123123BV',
        'description': 'Order description',
        'date': new Date(Date.now()).toISOString(),
        'orderAmount': null,
        'orderCurrency': null,
        'deliveryAmount': null,
        'deliveryCurrency': null,
        'items': [
            {
                'externalId': '243345345',
                'title': 'Product1',
                'amount': 50.61,
                'currency': 'MDL',
                'quantity': 3,
                'displayOrder': null,
            },
            {
                'externalId': '54353453',
                'title': 'Product2',
                'amount': 50.61,
                'currency': 'MDL',
                'quantity': 2,
                'displayOrder': null,
            },
        ],
    },
    'payerInfo': {
        'name': 'John D.',
        'email': 'test@gmail.com',
        'phone': '+37377382716',
        'ip': '192.168.172.22',
        'userAgent': 'Mozilla/5.0',
    },
    'language': 'ro',
    'callbackUrl': 'https://example.com/path',
    'successUrl': 'https://example.com/path',
    'failUrl': 'https://example.com/path',
};

const maibCheckoutRegisterResponse = await maibCheckoutApiRequest.checkoutRegister(maibCheckoutData, maibCheckoutToken);
const checkoutUrl = maibCheckoutRegisterResponse.checkoutUrl;
```

### Validate callback signature

```javascript
// https://docs.maibmerchants.md/checkout/api-reference/callback-notifications#signature-example
const callbackBody = '{"checkoutId":"5a4d27a4-79f5-426b-9403-cccdeee81747","paymentIntentId":"baa2a48d-b3ba-48b8-917e-07607d447c4f","merchantId":"37e48a96-37d7-49b3-8373-2e7e69ef8c2e","terminalId":"23456543","amount":193.54,"currency":"MDL","completedAt":"2024-11-23T19:35:00.6772285+02:00","payerName":"John","payerEmail":"Smith","payerPhone":"37368473653","payerIp":"192.175.12.22","orderId":"1142353","orderDescription":"OrderDescriptiondda760d7-a318-451b-8e47-f3377c06dcf5","orderDeliveryAmount":92.65,"orderDeliveryCurrency":8,"paymentId":"379b31a3-8283-43d4-8a7b-eef8c0736a32","paymentAmount":64.76,"paymentCurrency":"MDL","paymentStatus":"Executed","paymentExecutedAt":"2025-05-05T23:38:07.2760698+03:00","providerType":"Ips","senderIban":"NL43RABO1438227787","senderName":"Steven","senderCardNumber":"444433******1111","retrievalReferenceNumber":"ABC324353245"}';

const signatureHeader = 'sha256=h7/NNr0+SVwqfc1seJNl/m4M4/wzBiZwKHjE1gbmMKA=';
const signatureTimestamp = '1761032516817';
const signatureKey = '67be8e54-ac28-485d-9369-27f6d3c55a27';

const validationResult = MaibCheckoutSdk.validateCallbackSignature(callbackBody, signatureHeader, signatureTimestamp, signatureKey);
```

### Get checkout details

```javascript
const maibCheckoutDetailsResponse = await maibCheckoutApiRequest.checkoutDetails(maibCheckoutRegisterResponse.checkoutId, maibCheckoutToken);
```

### Refund payment

```javascript
const callbackData = JSON.parse(callbackBody);

const refundData = {
    'amount': 25.00,
    'reason': 'Test refund reason',
    // 'callbackUrl': 'https://example.com/refund' // Optional
};

const paymentRefundResponse = await maibCheckoutApiRequest.paymentRefund(callbackData.paymentId, refundData, maibCheckoutToken);
```
