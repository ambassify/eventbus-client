# Deprecated!

Use [https://github.com/ambassify/api-clients](https://github.com/ambassify/api-clients) instead.

# EventBus-client

A client to publish events to `eventbus`.

## Installation

```shell
npm install --save eventbus-client
```

## Usage

```javascript
const EventBus = require('eventbus-client');
const eventbus = new EventBus({
    endpoint: 'https://eventbus-endpoint'
});

eventbus.send('event_name', payload, options);
```

#### new EventBus()
```javascript
new EventBus({ endpoint, [accessToken], [timeout] })
```

- **endpoint**: The endpoint of the eventbus service.
- **accessToken**: The accessToken to use when none was set for the `.send()` call.
- **timeout**: The duration for which events are batched before publishing them.

#### .send()
```javascript
.send(eventName, payload, options)
```
- **eventName**: The event to publish. Example: `item_created`
- **payload**: Any object that can be serialized using `JSON.serialize`
- **options**: An object with any one of the following options set:
  - **accessToken**: This is required if not set when creating the eventbus instance.
  - **orgId**: The organization ID to publish to.
  - **userId**: The user ID to publish to.
  - **id**: The ID of the object in `payload`
  - **type**: The type of the object in `payload`
