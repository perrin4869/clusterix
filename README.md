# clusterix

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coverage Status][coveralls-badge]][coveralls]
[![Dependency Status][dependency-status-badge]][dependency-status]
[![devDependency Status][dev-dependency-status-badge]][dev-dependency-status]

> Node module for cluster node management

## Introduction

Inspired by [metroplex](https://github.com/primus/metroplex), this module is meant to be used standalone in order to detect nodes entering and leaving a cluster. This is useful, for example, if you are running [socket.io](https://github.com/socketio/socket.io) in a cluster, and you want to be able to detect a node failure and be able to clean up after it.

## Install

```
$ npm install --save clusterix
```

## Usage

Run this basic setup in 3 different node processes, for `i=1,2,3`:

```js
import Clusterix from 'clusterix';
import Redis from 'ioredis'

const ioredis = new Redis({ keyPrefix: 'myapp:clusterix' });
const cluster = new Clusterix(ioredis);
cluster.initializeNode(`node${i}`);
cluster.on('node down', async node => {
  console.log(`${node} is down, ${await cluster.nodes} are still up`);
});
```

After you kill one on the processes, for instance, `node3`, either `node1` or `node2` will output `node3 is down, node1,node2 are still up`.

## API

### class Clusterix extends EventEmitter

#### new Clusterix(redis, { id, pollInterval, timeout })

##### redis

Type: `object`

Instance of a redis client (tested with [ioredis](https://github.com/luin/ioredis)) used to store heartbeats. Should be completely setup with a key prefix.

##### id

Type: `string`, optional, default: `''`

The identifier for the cluster, can remain empty if using only one cluster (usually that's the case).

##### pollInterval

Type: `integer`, default: `500`

How often we poll the server for dead nodes in milliseconds.

##### timeout

The number of milliseconds before a node is considered down.

#### initializeNode(nodeId, { heartbeatInterval })

##### nodeId

Type: `string`, default: `${os.hostname()}:${process.env.PORT}`

The id of the node that initialized the instance of clusterix. Has to be unique across the cluster.

##### heartbeatInterval

Type: `integer`, default: `500`

Determines how often we send a heartbeat to redis. Has to be smaller than the `timeout` passed to the constructor.

#### dispose()

Clears all open handles (interval timeouts).

#### nodes

Type: `Promise<Array<string>>`

Returns the ids of all the nodes currently in the cluster

####

### Tests

```js
npm test
```

### TODO

* Extend API
* More tests
* Examples

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).

[build-badge]: https://img.shields.io/travis/perrin4869/clusterix/master.svg?style=flat-square
[build]: https://travis-ci.org/perrin4869/clusterix

[npm-badge]: https://img.shields.io/npm/v/clusterix.svg?style=flat-square
[npm]: https://www.npmjs.org/package/clusterix

[coveralls-badge]: https://img.shields.io/coveralls/perrin4869/clusterix/master.svg?style=flat-square
[coveralls]: https://coveralls.io/r/perrin4869/clusterix

[dependency-status-badge]: https://david-dm.org/perrin4869/clusterix.svg?style=flat-square
[dependency-status]: https://david-dm.org/perrin4869/clusterix

[dev-dependency-status-badge]: https://david-dm.org/perrin4869/clusterix/dev-status.svg?style=flat-square
[dev-dependency-status]: https://david-dm.org/perrin4869/clusterix#info=devDependencies
