/**
 * Node.js SDK for maib e-Commerce Checkout API
 * Custom Error Classes
 */

class MaibCheckoutError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class MaibCheckoutApiError extends MaibCheckoutError {
    constructor(message, response = null, error = null) {
        super(message, { cause: error });

        this.response = response;
    }
}

class MaibCheckoutValidationError extends MaibCheckoutError {
    constructor(message, error = null) {
        super(message, { cause: error });
    }
}

module.exports = {
    MaibCheckoutError,
    MaibCheckoutApiError,
    MaibCheckoutValidationError,
};
