const _pick = require('lodash/pick');
const fetch = require('node-fetch');
const mitt = require('mitt'); // 200kb event emitter
const URL = require('url');

function EventBusError(message, cause) {
    if (!(this instanceof EventBusError))
        return new EventBusError(message, cause);

    this.name = 'EventBusError';
    this.message = message;
    this.stack = (new Error()).stack;
}
EventBusError.prototype = new Error();
EventBusError.prototype.constructor = EventBusError;

function json(v) {
    try { return JSON.parse(v); }
    catch(e) { return v; }
}

function EventBusClient(options = {}) {
    this._timer = null;
    this._events = {};
    this._push = this._push.bind(this);

    if (!options.endpoint)
        throw new EventBusError('EventBus endpoint is required');

    this.endpoint = options.endpoint;
    this.accessToken = options.accessToken;
    this.timeout = options.timeout || 50;

    Object.assign(this, mitt());
}

EventBusClient.prototype = {

    send(eventName, payload, options = {}) {
        const accessToken = options.accessToken || this.accessToken;
        if (!accessToken) {
            this.emit('error', new EventBusError('No accessToken set'));
            return this;
        }

        const data = _pick(options, 'orgId', 'userId', 'id', 'type');
        data.payload = payload;


        if (!this._events[eventName])
            this._events[eventName] = [];

        this._events[eventName].push({
            eventName: eventName,
            accessToken: accessToken,
            data: data
        });

        if (this._timer === null)
            this._timer = setTimeout(this._push, this.timeout);

        return this;
    },

    _push() {
        const events = this._events;
        this._timer = null;
        this._events = {};
        const eventNames = Object.keys(events);

        eventNames.forEach(name => {
            events[name].forEach(data => this._trigger(name, data));
        });
    },

    _trigger(eventName, data) {
        let url = `event/${encodeURIComponent(eventName)}`;
        url = URL.resolve(this.endpoint, url);

        const opts = {
            method: 'POST',
            body: JSON.stringify(data.data),
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data.accessToken)
            opts.headers['Authorization'] = `BuboBox ${data.accessToken}`;

        fetch(url, opts)
            .then(res => {
                if (res.ok)
                    return res.json();

                return res.text()
                    .then(txt => {
                        const err = new EventBusError('Failed to push event data');
                        err.status = res.status;
                        err.response = json(txt);
                        throw err;
                    });
            })
            .catch(err => this.emit('error', err));
    }

};

module.exports = EventBusClient;
