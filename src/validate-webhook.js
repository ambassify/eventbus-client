const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function validateWebhook(publicKey, hookToken, body) {
    return new Promise((res, rej) => {
        jwt.verify(hookToken, publicKey, (err, p) => err ? rej(err) : res(p));
    })
    .then(payload => {
        let hash = crypto.createHash('sha256');
        hash.update(typeof body == 'string' ? body : JSON.stringify(body));
        hash = hash.digest('hex');

        if (payload.h !== hash)
            throw new Error('Payload hash does not match body');
    });
}

module.exports = validateWebhook;
