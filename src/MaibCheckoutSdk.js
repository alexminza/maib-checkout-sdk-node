/**
 * Node.js SDK for maib e-Commerce Checkout API
 * Main Class
 */

const { name: packageName, version: packageVersion } = require('../package.json');

const crypto = require('crypto');
const axios = require('axios');

const { SANDBOX_BASE_URL, DEFAULT_BASE_URL, DEFAULT_TIMEOUT } = require('./constants');
const { MaibCheckoutApiError, MaibCheckoutValidationError } = require('./errors');

class MaibCheckoutSdk {
    /**
     * Create a new MaibCheckoutSdk instance
     * @param {string} baseUrl - maib e-Commerce Checkout API base url
     * @param {number} timeout - API request timeout in milliseconds
     */
    constructor(baseUrl = DEFAULT_BASE_URL, timeout = DEFAULT_TIMEOUT) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;

        this.client = axios.create({
            baseURL: baseUrl,
            timeout: timeout,
            headers: {
                'User-Agent': `${packageName}-node/${packageVersion}`
            }
        });
    }

    setupLogging() {
        this.client.interceptors.request.use(
            (config) => {
                const logData = MaibCheckoutSdk._getLogData(config, config);
                console.debug(`${packageName} Request: ${logData.method} ${logData.url}`, logData);
                return config;
            },
            (error) => {
                console.error(`${packageName} Request: ${error.message}`, error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                const logData = MaibCheckoutSdk._getLogData(response, response?.config);
                console.debug(`${packageName} Response: ${logData.status} ${logData.method} ${logData.url}`, logData);
                return response;
            },
            (error) => {
                const config = error.response?.config || error.config;
                const logData = MaibCheckoutSdk._getLogData(error.response, config);
                console.error(`${packageName} Error: ${logData.status ?? ''} ${logData.data ?? ''}`, logData, error);
                return Promise.reject(error);
            }
        );
    }

    static _getLogData(object, config) {
        const logData = {
            'method': config?.method?.toUpperCase(),
            'url': config ? axios.getUri(config) : undefined,
            'data': object?.data,
            'params': config?.params,
            // 'headers': object?.headers?.toJSON?.() || config?.headers?.toJSON?.(),
            'status': object?.status
        }

        return logData;
    }

    /**
     * Sandbox base URL
     */
    static get SANDBOX_BASE_URL() {
        return SANDBOX_BASE_URL;
    }

    /**
     * Production base URL
     */
    static get DEFAULT_BASE_URL() {
        return DEFAULT_BASE_URL;
    }

    /**
     * Default API request timeout in milliseconds
     */
    static get DEFAULT_TIMEOUT() {
        return DEFAULT_TIMEOUT;
    }

    /**
     * Perform API request
     * @param {string} method - Request HTTP method
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} params - Request params
     * @param {string} token - Access token
     * @returns {Promise<Object>} API request response
     */
    async _sendRequest(method, url, data = null, params = null, token = null) {
        const requestConfig = {
            url: url,
            method: method,
            data: data,
            headers: {
                ...this.client.defaults.headers.common,
                ...MaibCheckoutSdk._getAuthHeaders(token)
            },
            params: params,
            // https://github.com/axios/axios/issues/41
            validateStatus: () => true
        }

        const response = await this.client.request(requestConfig);
        return MaibCheckoutSdk._handleResponse(response, url);
    }

    /**
     * Set authorization header
     * @param {string} token - Access token
     * @returns {Object} - Headers object
     */
    static _getAuthHeaders(token) {
        if (!token) return null;

        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Handles errors returned by the API
     * @param {axios.AxiosResponse} response - Response object
     * @param {string} endpoint - API endpoint
     * @throws {MaibCheckoutApiError} - When received a server error from the API
     */
    static _handleResponse(response, endpoint) {
        if (!response.data)
            throw new MaibCheckoutApiError(`Invalid response received from server for endpoint ${endpoint}`, response);

        if (response.data.ok) {
            if (response.data.result)
                return response.data.result;

            throw new MaibCheckoutApiError(`Invalid response received from server for endpoint ${endpoint}: missing 'result' field`, response);
        }

        if (response.data.errors && response.data.errors.length > 0) {
            const errorMessages = response.data.errors.map(error => `${error.errorMessage} (${error.errorCode})`).join('; ');
            throw new MaibCheckoutApiError(`Error sending request to endpoint ${endpoint}: ${errorMessages}`, response);
        }

        throw new MaibCheckoutApiError(`Invalid response received from server for endpoint ${endpoint}: missing 'ok' and 'errors' fields`, response);
    }

    /**
     * Validate callback data signature
     * @param {string} callbackBody - Callback message (exact raw JSON body as string)
     * @param {string} signatureHeader - X-Signature header value
     * @param {string} signatureTimestamp - X-Signature-Timestamp header value
     * @param {string} signatureKey - Merchant’s shared secret key
     * @returns {boolean} - True if signature is valid, false otherwise
     * @link https://docs.maibmerchants.md/checkout/api-reference/callback-notifications
     * @link https://docs.maibmerchants.md/checkout/api-reference/examples/signature-key-verification
     * @throws {MaibCheckoutValidationError} - If Callback body, Signature Header, Signature Timestamp or Signature Key are invalid
     */
    static validateCallbackSignature(callbackBody, signatureHeader, signatureTimestamp, signatureKey) {
        if (!callbackBody || !signatureHeader || !signatureTimestamp || !signatureKey) {
            throw new MaibCheckoutValidationError('Invalid arguments');
        }

        // Extract signature
        const prefix = 'sha256=';
        const callbackSignature = signatureHeader.startsWith(prefix)
            ? signatureHeader.substring(prefix.length)
            : '';

        if (!callbackSignature) {
            throw new MaibCheckoutValidationError('Invalid callback signature');
        }

        const computedResultSignature = MaibCheckoutSdk.computeDataSignature(callbackBody, signatureTimestamp, signatureKey);
        return crypto.timingSafeEqual(Buffer.from(computedResultSignature), Buffer.from(callbackSignature));
    }

    static computeDataSignature(callbackBody, signatureTimestamp, signatureKey) {
        // Build message: JSON + "." + timestamp
        const message = `${callbackBody}.${signatureTimestamp}`;

        // Compute HMAC SHA256
        const hmac = crypto.createHmac('sha256', signatureKey);
        hmac.update(message);
        return hmac.digest('base64');
    }
}

module.exports = MaibCheckoutSdk;
