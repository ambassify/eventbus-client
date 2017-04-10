const getPublicKey = require('./public-key');
const validateWebhook = require('./validate-webhook');

function error(status, err, res, next, rethrow) {
    err = typeof err == 'string' ? new Error(err) : err;
    err.status = status;

    if (rethrow)
        next(err);
    else
        res.status(status).send(err.message);
}

function makeEventbusMiddleware(baseUrl, rethrow = false) {
    return function eventbusMiddleware(req, res, next) {
        const token = req.get('x-eventbus-authentication');

        if (!token)
            return error(400, 'No valid EventBus token found', res, next, rethrow);

        if (!req.body)
            return error(500, 'Unable to find body, use body-parser', res, next, rethrow);

        getPublicKey(baseUrl)
        .then(publicKey => validateWebhook(publicKey, token, req.body))
        .then(
            () => next(),
            err => error(403, err, res, next, rethrow)
        );
    };
}

module.exports = { makeEventbusMiddleware };
