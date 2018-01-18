const URL = require('url');
const fetch = require('@ambassify/fetch');

const CACHE = {};
const MAX_AGE = 300 * 1000;

function getPublicKey(baseUrl, maxAge = MAX_AGE, staleOnError = true) {
    const cache = CACHE[baseUrl] = CACHE[baseUrl] || {};

    if (cache.pendingPromise)
        return cache.pendingPromise;

    const lastFetched = cache.time || 0;
    if (lastFetched > Date.now() - maxAge)
        return Promise.resolve(cache.data);

    const url = URL.resolve(baseUrl, 'key/public');
    cache.pendingPromise = fetch(url)
        .then(resp => {
            if (resp.ok)
                return resp.text();

            throw new Error(`Failed to fetch eventbus public token due to status code ${resp.status}`);
        })
        .then(data => {
            cache.data = data;
            cache.time = Date.now();
            cache.pendingPromise = null;
        })
        .catch(err => {
            if (staleOnError && cache.data)
                return;

            throw err;
        })
        .then(() => cache.data);

    return cache.pendingPromise;
}

module.exports = getPublicKey;
