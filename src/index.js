import { EventEmitter } from 'events';
import os from 'os';

const defaultNodeId = () => `${os.hostname()}:${process.env.PORT}`;

export default class extends EventEmitter {
  constructor(redis, {
    id = null,
    pollInterval = 500,
    timeout = 1000,
  } = {}) {
    super();

    this.id = id;
    this.redis = redis;
    this.timeout = timeout;

    this.pollTimer = setInterval(this.poll, pollInterval);
  }

  #redisKey(key) {
    return (this.id && this.id.length)
      ? `${this.id}:${key}`
      : key;
  }

  get nodes() {
    return this.redis.hkeys(this.redisKey('heartbeats'));
  }

  initializeNode(nodeId = defaultNodeId(), { heartbeatInterval = 500 } = {}) {
    if (heartbeatInterval > this.timeout) throw new Error('Interval should be less than timeout');

    return this.redis.hset(this.redisKey('heartbeats'), nodeId, Date.now())
      .then((initialized) => {
        if (initialized) { // key was added
          this.nodeId = nodeId;
          this.heartbeatTimer = setInterval(this.heartbeat, heartbeatInterval);

          return this;
        }

        // initialized === 0, key already existed
        throw new Error('Node with this id already existed');
      });
  }

  heartbeat = () => (
    this.redis.hset(this.redisKey('heartbeats'), this.nodeId, Date.now())
      .then((initialized) => {
        if (initialized) this.emit('reconnect');
      })
  )

  poll = () => (
    this.redis.hgetall(this.redisKey('heartbeats')).then(
      (heartbeats) => Promise.all(Object.keys(heartbeats)
        .filter((nodeid) => Date.now() - parseInt(heartbeats[nodeid], 10) > this.timeout)
        .map((nodeid) => this.redis.hdel(this.redisKey('heartbeats'), nodeid)
          .then((deleted) => deleted && this.emit('node down', nodeid)))),
    )
  )

  dispose() {
    clearTimeout(this.heartbeatTimer);
    clearTimeout(this.pollTimer);

    this.heartbeatTimer = null;
    this.pollTimer = null;
  }
}
