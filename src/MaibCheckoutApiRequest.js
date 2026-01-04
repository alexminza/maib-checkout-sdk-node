/**
 * Node.js SDK for maib e-Commerce Checkout API
 * API Request Handler
 */

const { API_ENDPOINTS, REQUIRED_PARAMS } = require('./constants');
const { MaibCheckoutValidationError } = require('./errors');

const MaibCheckoutSdk = require('./MaibCheckoutSdk');

class MaibCheckoutApiRequest {
    //#region Init
    /**
     * Create a new MaibCheckoutApiRequest instance
     * @param {string} baseUrl - maib e-Commerce Checkout API base url
     * @param {number} timeout - API request timeout in milliseconds
     */
    constructor(baseUrl = MaibCheckoutSdk.DEFAULT_BASE_URL, timeout = MaibCheckoutSdk.DEFAULT_TIMEOUT) {
        this.client = new MaibCheckoutSdk(baseUrl, timeout);
    }

    /**
     * Static factory method to create an instance
     * @param {string} baseUrl - maib e-Commerce Checkout API base url
     * @param {number} timeout - API request timeout in milliseconds
     * @returns {MaibCheckoutApiRequest}
     */
    static create(baseUrl = MaibCheckoutSdk.DEFAULT_BASE_URL, timeout = MaibCheckoutSdk.DEFAULT_TIMEOUT) {
        return new MaibCheckoutApiRequest(baseUrl, timeout);
    }
    //#endregion

    //#region Auth
    /**
     * Obtain Authentication Token
     * @param {string} clientId - Client ID
     * @param {string} clientSecret - Client secret
     * @returns {Promise<Object>} - Token response object
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/authentication/obtain-authentication-token
     * @throws {MaibCheckoutValidationError} - If Client ID or Client secret are invalid
     */
    async generateToken(clientId, clientSecret) {
        if (!clientId || !clientSecret) {
            throw new MaibCheckoutValidationError('Client ID and Client Secret are required');
        }

        const tokenData = { clientId, clientSecret };
        return this.client._sendRequest('POST', API_ENDPOINTS.AUTH_TOKEN, tokenData);
    }
    //#endregion

    //#region Operation
    /**
     * Perform API request
     * @param {string} endpoint - API endpoint
     * @param {string} authToken - Access token
     * @param {Object} data - Request data
     * @param {string[]} requiredParams - Array of required field names
     * @param {string} method - Request HTTP method
     * @param {Object} params - Request params
     */
    async _executeOperation(endpoint, authToken, data = null, requiredParams = null, method = 'POST', params = null) {
        MaibCheckoutApiRequest._validateAccessToken(authToken);
        MaibCheckoutApiRequest._validateParams(data, requiredParams);

        return this.client._sendRequest(method, endpoint, data, params, authToken);
    }

    /**
     * Replace path parameters in URL
     * @param {string} path - URL path with parameters
     * @param {Object} params - Parameters to replace
     * @returns {string} - Path with replaced parameters
     */
    static _buildEndpoint(path, params) {
        let result = path;

        for (const [key, value] of Object.entries(params)) {
            MaibCheckoutApiRequest._validateIdParam(value);
            result = result.replace(`:${key}`, value);
        }

        return result;
    }

    /**
     * Validates Entity ID
     * @param {string} entityId - Entity ID
     * @throws {MaibCheckoutValidationError} - If Entity ID parameter is invalid
     */
    static _validateIdParam(entityId) {
        if (!entityId) {
            throw new MaibCheckoutValidationError('ID parameter is required');
        }
    }

    /**
     * Validates the access token
     * @param {string} token - Access token
     * @throws {MaibCheckoutValidationError} - If Access token parameter is invalid
     */
    static _validateAccessToken(token) {
        if (!token) {
            throw new MaibCheckoutValidationError('Access token is required');
        }
    }

    /**
     * Validate required parameters
     * @param {Object} data - Data object to validate
     * @param {string[]} requiredParams - Array of required parameter names
     * @throws {MaibCheckoutValidationError} - If any required parameter is missing
     */
    static _validateParams(data, requiredParams) {
        if (!requiredParams || requiredParams.length === 0) {
            return;
        }

        if (!data) {
            throw new MaibCheckoutValidationError(`Missing required parameters: ${requiredParams.join(', ')}`);
        }

        const missingParams = requiredParams.filter(field =>
            data[field] === undefined || data[field] === null
        );

        if (missingParams.length > 0) {
            throw new MaibCheckoutValidationError(`Missing required parameters: ${missingParams.join(', ')}`);
        }
    }
    //#endregion

    //#region Checkout Session
    /**
     * Register a new hosted checkout session
     * @param {Object} checkoutData - Checkout session data
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Checkout session registration response
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/register-a-new-hosted-checkout-session
     */
    async checkoutRegister(checkoutData, authToken) {
        return this._executeOperation(API_ENDPOINTS.CHECKOUTS, authToken, checkoutData, REQUIRED_PARAMS.CHECKOUT_PARAMS);
    }

    /**
     * Cancel a checkout session
     * @param {string} checkoutId - Checkout session ID
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Cancellation response
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/cancel-a-checkout-session
     */
    async checkoutCancel(checkoutId, authToken) {
        const endpoint = MaibCheckoutApiRequest._buildEndpoint(API_ENDPOINTS.CHECKOUTS_CANCEL, { checkoutId });
        return this._executeOperation(endpoint, authToken);
    }

    /**
     * Get checkout details
     * @param {string} checkoutId - Checkout session ID
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Checkout session details
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/get-checkout-details
     */
    async checkoutDetails(checkoutId, token) {
        const endpoint = MaibCheckoutApiRequest._buildEndpoint(API_ENDPOINTS.CHECKOUTS_DETAILS, { checkoutId });
        return this._executeOperation(endpoint, token, null, null, 'GET');
    }

    /**
     * Retrieve all checkouts
     * @param {Object} checkoutListParams - Retrieval params
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Retrieval response
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/retrieve-all-checkouts
     */
    async checkoutList(checkoutListParams, authToken) {
        return this._executeOperation(API_ENDPOINTS.CHECKOUTS, authToken, null, null, 'GET', checkoutListParams);
    }
    //#endregion

    //#region Payment
    /**
     * Get payment by id
     * @param {string} paymentId - Payment ID
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Payment details response
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/get-payment-by-id
     */
    async paymentDetails(paymentId, authToken) {
        const endpoint = MaibCheckoutApiRequest._buildEndpoint(API_ENDPOINTS.PAYMENTS_ID, { paymentId });
        return this._executeOperation(endpoint, authToken, null, null, 'GET');
    }

    /**
     * Retrieve all payments by filter
     * @param {Object} paymentListParams - Retrieval params
     * @param {string} authToken - Access token
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/retrieve-all-payments-by-filter
     * @returns {Promise<Object>} - Retrieval response
     */
    async paymentList(paymentListParams, authToken) {
        return this._executeOperation(API_ENDPOINTS.PAYMENTS, authToken, null, null, 'GET', paymentListParams);
    }

    /**
     * Refund a payment
     * @param {string} paymentId - Payment ID
     * @param {Object} refundData - Refund data
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Refund response
     * @link https://docs.maibmerchants.md/checkout/api-reference/endpoints/refund-a-payment
     */
    async paymentRefund(paymentId, refundData, authToken) {
        const endpoint = MaibCheckoutApiRequest._buildEndpoint(API_ENDPOINTS.PAYMENTS_REFUND, { paymentId });
        return this._executeOperation(endpoint, authToken, refundData);
    }
    //#endregion

    //#region Payment Simulation
    /**
     * Payment Simulation (Sandbox)
     * @param {Object} testPayData - Test payment data
     * @param {string} authToken - Access token
     * @returns {Promise<Object>} - Test payment response
     * @link https://docs.maibmerchants.md/mia-qr-api/en/payment-simulation-sandbox
     */
    async miaTestPay(testPayData, authToken) {
        return this._executeOperation(API_ENDPOINTS.MIA_TEST_PAY, authToken, testPayData, REQUIRED_PARAMS.MIA_TEST_PAY_PARAMS);
    }
    //#endregion
}

module.exports = MaibCheckoutApiRequest;
