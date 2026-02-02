const {
    MaibCheckoutSdk,
    MaibCheckoutApiRequest,
    MaibCheckoutValidationError,
    MaibCheckoutApiError
} = require('../src');

const context = {
    apiRequest: null
};

function init() {
    context.apiRequest = MaibCheckoutApiRequest.create('https://api.example.com');
}

async function testCheckoutRegisterValidation() {
    await expect(context.apiRequest.checkoutRegister({}, 'token')).rejects.toThrow(MaibCheckoutValidationError);
    await expect(context.apiRequest.checkoutRegister({ amount: 10 }, 'token')).rejects.toThrow(MaibCheckoutValidationError);
    await expect(context.apiRequest.checkoutRegister({ currency: 'MDL' }, 'token')).rejects.toThrow(MaibCheckoutValidationError);
}

async function testCheckoutRegisterSuccess() {
    // Mock _sendRequest to avoid actual network call
    context.apiRequest.client._sendRequest = jest.fn().mockResolvedValue({ ok: true, result: {} });

    await context.apiRequest.checkoutRegister({ amount: 10, currency: 'MDL' }, 'token');
    expect(context.apiRequest.client._sendRequest).toHaveBeenCalledWith(
        'POST',
        'checkouts',
        { amount: 10, currency: 'MDL' },
        null,
        'token'
    );
}

async function testPaymentListValidation() {
    await expect(context.apiRequest.paymentList({}, 'token')).rejects.toThrow(MaibCheckoutValidationError);
    await expect(context.apiRequest.paymentList({ count: 10 }, 'token')).rejects.toThrow(MaibCheckoutValidationError);
    await expect(context.apiRequest.paymentList({ offset: 0 }, 'token')).rejects.toThrow(MaibCheckoutValidationError);
}

async function testPaymentListSuccess() {
    context.apiRequest.client._sendRequest = jest.fn().mockResolvedValue({ ok: true, result: {} });

    await context.apiRequest.paymentList({ count: 10, offset: 0 }, 'token');
    expect(context.apiRequest.client._sendRequest).toHaveBeenCalledWith(
        'GET',
        'payments',
        null,
        { count: 10, offset: 0 },
        'token'
    );
}

async function testPaymentRefundNoValidation() {
    context.apiRequest.client._sendRequest = jest.fn().mockResolvedValue({ ok: true, result: {} });

    await context.apiRequest.paymentRefund('payId', {}, 'token');
    expect(context.apiRequest.client._sendRequest).toHaveBeenCalled();
}

async function testHandleResponseError() {
    const response = {
        data: {
            ok: false,
            errors: [
                { errorCode: 'err1', errorMessage: 'Message 1' }
            ]
        }
    };

    expect(() => MaibCheckoutSdk._handleResponse(response, 'endpoint')).toThrow(MaibCheckoutApiError);
    try {
        MaibCheckoutSdk._handleResponse(response, 'endpoint');
    } catch (e) {
        expect(e.message).toContain('Message 1 (err1)');
    }
}

describe('MaibCheckoutSdk Validation Tests', () => {
    beforeEach(init);

    test('checkoutRegister should require amount and currency', testCheckoutRegisterValidation);
    test('checkoutRegister should succeed with only amount and currency', testCheckoutRegisterSuccess);
    test('paymentList should require count and offset', testPaymentListValidation);
    test('paymentList should succeed with count and offset', testPaymentListSuccess);
    test('paymentRefund should not require anything now', testPaymentRefundNoValidation);
    test('_handleResponse should handle OperationResult with errors', testHandleResponseError);
});
