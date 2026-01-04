/**
 * Node.js SDK for maib e-Commerce Checkout API
 * Constants
 */

// maib e-Commerce Checkout API base urls
// https://docs.maibmerchants.md/checkout/getting-started/api-fundamentals
const DEFAULT_BASE_URL = 'https://api.maibmerchants.md/v2/';
const SANDBOX_BASE_URL = 'https://sandbox.maibmerchants.md/v2/';

const DEFAULT_TIMEOUT = 30000; // milliseconds

const API_ENDPOINTS = {
    AUTH_TOKEN: 'auth/token',

    // maib e-Commerce Checkout API endpoints
    // https://docs.maibmerchants.md/checkout/api-reference/endpoints
    CHECKOUTS: 'checkouts',
    CHECKOUTS_CANCEL: 'checkouts/:checkoutId/cancel',
    CHECKOUTS_DETAILS: 'checkouts/:checkoutId',

    PAYMENTS: 'payments',
    PAYMENTS_ID: 'payments/:payId',
    PAYMENTS_REFUND: 'payments/:payId/refund',
};

const REQUIRED_PARAMS = {
    // https://docs.maibmerchants.md/checkout/api-reference/endpoints/register-a-new-hosted-checkout-session#request
    CHECKOUT_PARAMS: ['amount', 'currency', 'orderInfo', 'callbackUrl'],
    // https://docs.maibmerchants.md/checkout/api-reference/endpoints/refund-a-payment#request
    PAYMENTS_REFUND_PARAMS: ['amount', 'reason']
}

module.exports = {
    DEFAULT_BASE_URL,
    SANDBOX_BASE_URL,
    DEFAULT_TIMEOUT,
    API_ENDPOINTS,
    REQUIRED_PARAMS
};
