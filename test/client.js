const assert = require('assert');
const nock = require('nock');

describe('#eventbus', function() {

    const EventBus = require('../src/client');

    function printNoMatch(req, res) {
        console.log(`Unexpected request received ${res.method}: ${res.url}`);
    };

    before(function() {
        nock.emitter.on('no match', printNoMatch);
    });

    after(function() {
        nock.emitter.removeListener('no match', printNoMatch);
        nock.cleanAll();
    });

    it('Should throw when no endpoint is set', function() {
        assert.throws(function() {
            new EventBus();
        });

        assert.throws(function() {
            new EventBus({});
        });
    });

    it('Should fire a request for the EventBus', function() {
        const request = nock('http://fake-eventbus.ambassify.eu')
            .post('/eventbus/event/event_created', {
                payload: { 'hello': 'world' }
            })
            .reply(201, {});

        const eventbus = new EventBus({
            endpoint: 'http://fake-eventbus.ambassify.eu/eventbus/',
            timeout: 10,
            accessToken: '123'
        });

        eventbus.on('error', err => console.log(err));

        eventbus.send('event_created', {
            'hello': 'world'
        });

        return new Promise(resolve => setTimeout(resolve, 20))
            .then(() => {
                assert(request.isDone(), 'matched request');
            });
    });

    it('Should be able to send multiple events', function() {
        const request1 = nock('http://fake-eventbus.ambassify.eu')
            .post('/eventbus/event/event_created', {
                payload: { 'hello': 'world' }
            })
            .reply(201, {});
        const request2 = nock('http://fake-eventbus.ambassify.eu')
            .post('/eventbus/event/event_created', {
                payload: { 'hello': 'world' }
            })
            .reply(201, {});

        const eventbus = new EventBus({
            endpoint: 'http://fake-eventbus.ambassify.eu/eventbus/',
            timeout: 10,
            accessToken: '123'
        });

        eventbus.send('event_created', { 'hello': 'world' });
        eventbus.send('event_created', { 'hello': 'world' });

        return new Promise(resolve => setTimeout(resolve, 20))
            .then(() => {
                assert(request1.isDone(), 'matched request 1');
                assert(request2.isDone(), 'matched request 2');
            });
    });

    it('Should append header passed through options', function() {
        const request = nock('http://fake-eventbus.ambassify.eu', {
                reqheaders: {
                    'authorization': 'Bearer 2222',
                    'x-api-key': '2222'
                }
            })
            .post('/eventbus/event/event_created', {
                payload: { 'hello': 'world' }
            })
            .reply(201, {});

        const eventbus = new EventBus({
            endpoint: 'http://fake-eventbus.ambassify.eu/eventbus/',
            timeout: 10
        });

        eventbus.send('event_created',
            { 'hello': 'world' },
            { accessToken: '2222' });

        return new Promise(resolve => setTimeout(resolve, 20))
            .then(() => {
                assert(request.isDone(), 'matched request');
            });
    })

    it('Should emit error event', function(done) {
        const request = nock('http://fake-eventbus.ambassify.eu')
            .post('/eventbus/event/event_created')
            .reply(403, {});

        const eventbus = new EventBus({
            endpoint: 'http://fake-eventbus.ambassify.eu/eventbus/',
            accessToken: '123'
        });

        // Set it later on to mark constructor branch as used.
        eventbus.timeout = 10;

        eventbus.on('error', function(err) {
            try {
                assert.equal(err.message, 'Failed to push event data');
                done();
            } catch(e) { done(e); }
        });

        eventbus.send('event_created', { 'hello': 'world' });
    })

});
