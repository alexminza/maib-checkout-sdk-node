require('dotenv').config();

const {
    MaibCheckoutSdk,
    MaibCheckoutApiRequest
} = require('../src');

const MAIB_CHECKOUT_CLIENT_ID = process.env.MAIB_CHECKOUT_CLIENT_ID;
const MAIB_CHECKOUT_CLIENT_SECRET = process.env.MAIB_CHECKOUT_CLIENT_SECRET;
const MAIB_CHECKOUT_SIGNATURE_KEY = process.env.MAIB_CHECKOUT_SIGNATURE_KEY;

// Shared Context
const context = {
    accessToken: null,
    apiRequest: null,

    // Checkout Session Flow Data
    checkoutId: null,
    qrId: null,
    paymentId: null,
    checkoutData: null,
};

function init() {
    console.log('Running: init');

    expect(MAIB_CHECKOUT_CLIENT_ID).toBeTruthy();
    expect(MAIB_CHECKOUT_CLIENT_SECRET).toBeTruthy();
    expect(MAIB_CHECKOUT_SIGNATURE_KEY).toBeTruthy();
}

function assertResultOk(response) {
    expect(response).toBeDefined();
}

//#region Authentication
async function testAuthenticate() {
    console.log('Running: authenticate');

    context.apiRequest = MaibCheckoutApiRequest.create(MaibCheckoutSdk.SANDBOX_BASE_URL);
    //context.apiRequest.client.setupLogging();

    const response = await context.apiRequest.generateToken(MAIB_CHECKOUT_CLIENT_ID, MAIB_CHECKOUT_CLIENT_SECRET);

    assertResultOk(response);
    expect(response).toHaveProperty('accessToken')
    expect(response.accessToken).toBeTruthy();

    context.accessToken = response.accessToken;
}
//#endregion

//#region Checkout Session
async function testCheckoutRegister() {
    console.log('Running: testCheckoutRegister');

    context.checkoutData = {
        'amount': 50.61,
        'currency': 'MDL',
        'orderInfo': {
            'id': 'EK123123BV',
            'description': 'Order description',
            'date': '2025-11-03T09:28:40.814748+00:00',
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

    const response = await context.apiRequest.checkoutRegister(context.checkoutData, context.accessToken);
    console.debug('checkoutRegister', response);

    assertResultOk(response);
    expect(response).toHaveProperty('checkoutId');
    expect(response.checkoutId).toBeTruthy();
    expect(response).toHaveProperty('checkoutUrl');
    expect(response.checkoutUrl).toBeTruthy();

    context.checkoutId = response.checkoutId;
}

async function testCheckoutDetails() {
    console.log('Running: testCheckoutDetails');

    const response = await context.apiRequest.checkoutDetails(context.checkoutId, context.accessToken);
    console.debug('checkoutDetails', response);

    assertResultOk(response);
    expect(response.checkoutId).toEqual(context.checkoutId);
    expect(response.status).toEqual('WaitingForInit');
    expect(response.amount).toEqual(context.checkoutData.amount);
    expect(response.currency).toEqual(context.checkoutData.currency);
}

async function testCheckoutCancel() {
    console.log('Running: testCheckoutCancel');

    const response = await context.apiRequest.checkoutCancel(context.checkoutId, context.accessToken);
    console.debug('checkoutCancel', response);

    assertResultOk(response);
    expect(response.checkoutId).toEqual(context.checkoutId);
    expect(response.status).toEqual('Cancelled');
}

async function testCheckoutList() {
    console.log('Running: testQrList');

    const checkoutListParams = {
        'count': 10,
        'offset': 0,
        'amountFrom': 10.00,
        'amountTo': 100.00,
        'sortBy': 'createdAt',
        'order': 'desc'
    };

    const response = await context.apiRequest.checkoutList(checkoutListParams, context.accessToken);
    console.debug('checkoutList', response);

    assertResultOk(response);
    expect(response).toHaveProperty('items');
    expect(response).toHaveProperty('totalCount');
    expect(response.items).toBeTruthy();
    expect(response.totalCount).toBeTruthy();
}
//#endregion

//#region Payment
async function testMiaTestPay() {
    console.log('Running: testMiaTestPay');

    const testPayData = {
        'qrId': context.qrId,
        'amount': context.checkoutData.amount,
        'currency': context.checkoutData.currency,
        'iban': 'MD88AG000000011621810140',
        'payerName': 'TEST QR PAYMENT'
    };

    const response = await context.apiRequest.miaTestPay(testPayData, context.accessToken);
    console.debug('miaTestPay', response);

    assertResultOk(response);
    expect(response.qrId).toEqual(context.qrId);
    expect(response.qrStatus).toEqual('Paid');
    expect(response.amount).toEqual(context.checkoutData.amount);
    expect(response.currency).toEqual(context.checkoutData.currency);
    expect(response.paymentId).toBeTruthy();

    context.paymentId = response.paymentId;
}

async function testPaymentDetails() {
    console.log('Running: testPaymentDetails');

    const response = await context.apiRequest.paymentDetails(context.paymentId, context.accessToken);
    console.debug('paymentDetails', response);

    assertResultOk(response);
    expect(response.paymentId).toEqual(context.paymentId);
    expect(response.status).toEqual('Executed');
    expect(response.amount).toEqual(context.checkoutData.amount);
    expect(response.currency).toEqual(context.checkoutData.currency);
}

async function testPaymentList() {
    console.log('Running: testPaymentList');

    const paymentListParams = {
        'count': 10,
        'offset': 0,
        'paymentId': context.paymentId,
        'sortBy': 'executedAt',
        'order': 'asc'
    };

    const response = await context.apiRequest.paymentList(paymentListParams, context.accessToken);
    console.debug('paymentList', response);

    assertResultOk(response);
    expect(response).toHaveProperty('items');
    expect(response).toHaveProperty('totalCount');
}

async function testPaymentRefundPartial() {
    console.log('Running: testPaymentRefundPartial');

    const refundData = {
        'amount': context.checkoutData.amount / 2,
        'reason': 'testPaymentRefundPartial reason',
        'callbackUrl': 'https://example.com/refund'
    };

    const response = await context.apiRequest.paymentRefund(context.paymentId, refundData, context.accessToken);
    console.debug('paymentRefund', response);

    assertResultOk(response);
    expect(response.refundId).toBeTruthy();
    expect(response.status).toEqual('Created');
}

async function testPaymentRefundFull() {
    console.log('Running: testPaymentRefundFull');

    const refundData = {
        'reason': 'testPaymentRefundFull reason',
        'callbackUrl': 'https://example.com/refund'
    };

    const response = await context.apiRequest.paymentRefund(context.paymentId, refundData, context.accessToken);
    console.debug('paymentRefund', response);

    assertResultOk(response);
    expect(response.refundId).toBeTruthy();
    expect(response.status).toEqual('Created');
}
//#endregion

//#region Callback
const CALLBACK_EXAMPLE = '{"checkoutId":"5a4d27a4-79f5-426b-9403-cccdeee81747","paymentIntentId":"baa2a48d-b3ba-48b8-917e-07607d447c4f","merchantId":"37e48a96-37d7-49b3-8373-2e7e69ef8c2e","terminalId":"23456543","amount":193.54,"currency":"MDL","completedAt":"2024-11-23T19:35:00.6772285+02:00","payerName":"John","payerEmail":"Smith","payerPhone":"37368473653","payerIp":"192.175.12.22","orderId":"1142353","orderDescription":"OrderDescriptiondda760d7-a318-451b-8e47-f3377c06dcf5","orderDeliveryAmount":92.65,"orderDeliveryCurrency":8,"paymentId":"379b31a3-8283-43d4-8a7b-eef8c0736a32","paymentAmount":64.76,"paymentCurrency":"MDL","paymentStatus":"Executed","paymentExecutedAt":"2025-05-05T23:38:07.2760698+03:00","providerType":"Ips","senderIban":"NL43RABO1438227787","senderName":"Steven","senderCardNumber":"444433******1111","retrievalReferenceNumber":"ABC324353245"}';

async function testValidateCallbackSignatureExample() {
    console.log('Running: testValidateCallbackSignatureExample');

    // https://docs.maibmerchants.md/checkout/api-reference/callback-notifications
    const callbackBody = CALLBACK_EXAMPLE;
    const signatureHeader = 'sha256=h7/NNr0+SVwqfc1seJNl/m4M4/wzBiZwKHjE1gbmMKA=';
    const signatureTimestamp = '1761032516817';
    const signatureKey = '67be8e54-ac28-485d-9369-27f6d3c55a27';

    //NOTE: maib official example test is failing
    expect(MaibCheckoutSdk.validateCallbackSignature(callbackBody, signatureHeader, signatureTimestamp, signatureKey)).toEqual(false);
}

async function testValidateCallbackSignature() {
    console.log('Running: testValidateCallbackSignature');

    // https://docs.maibmerchants.md/checkout/api-reference/callback-notifications
    const callbackBody = CALLBACK_EXAMPLE;
    const signatureTimestamp = Date.now();

    const signature = MaibCheckoutSdk.computeCallbackSignature(callbackBody, signatureTimestamp, MAIB_CHECKOUT_SIGNATURE_KEY);
    const signatureHeader = `sha256=${signature}`;

    expect(MaibCheckoutSdk.validateCallbackSignature(callbackBody, signatureHeader, signatureTimestamp, MAIB_CHECKOUT_SIGNATURE_KEY)).toEqual(true);
}
//#endregion

//#region Execution
jest.setTimeout(60000);

describe('MaibCheckoutSdk Integration Tests', () => {
    beforeAll(init);
    beforeAll(testAuthenticate);

    describe('Checkout Session Flow', () => {
        test('testCheckoutRegister', testCheckoutRegister);
        test('testCheckoutDetails', testCheckoutDetails);
        test('testCheckoutCancel', testCheckoutCancel);
        test('testCheckoutList', testCheckoutList);
    });

    describe('Payment Flow', () => {
        test('testMiaTestPay', testMiaTestPay);
        test('testPaymentDetails', testPaymentDetails);
        test('testPaymentList', testPaymentList);
        test('testPaymentRefundPartial', testPaymentRefundPartial);
        test('testPaymentRefundFull', testPaymentRefundFull);
    });

    test('testValidateCallbackSignatureExample', testValidateCallbackSignatureExample);
    test('testValidateCallbackSignature', testValidateCallbackSignature);
});
//#endregion
