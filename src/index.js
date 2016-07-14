import { EventEmitter } from 'events';
import os from 'os';

const defaultNodeId = `${os.hostname()}:${process.env.PORT}`;

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

  get nodes() {
    return this.redis.hkeys(this.redisKey('heartbeats'));
  }

  redisKey(key) {
    return (this.id && this.id.length) ?
      `${this.id}:${key}` :
      key;
  }

  initializeNode(nodeId = defaultNodeId, { heartbeatInterval = 500 }) {
    if (heartbeatInterval > this.timeout) throw new Error('Interval should be less than timeout');

    return this.redis.hset(this.redisKey('heartbeats'), nodeId, Date.now())
    .then(initialized => {
      if (initialized) { // key was added
        this.nodeId = nodeId;
        this.heartbeatTimer = setInterval(this.heartbeat, heartbeatInterval);
      } else { // initialized === 0, key already existed
        throw new Error('Node with this id already existed');
      }
    });
  }

  heartbeat = () => (
    this.redis.hset(this.redisKey('heartbeats'), this.nodeId, Date.now())
    .then(initialized => {
      if (initialized) this.emit('reconnect');
    })
  )

  nodesHeartbeats() {
    return this.redis.hgetall(this.redisKey('heartbeats'))
    .then(
      nodes => Object.keys(nodes).map(id => ({
        id,
        heartbeat: parseInt(nodes[id], 10),
      }))
    );
  }

  poll = () => (
    this.nodesHeartbeats().each(node => {
      if (Date.now() - node.heartbeat > this.timeout) {
        this.redis.hdel(this.redisKey('heartbeats'), node.id)
        .then(deleted => {
          if (deleted) this.emit('node down', node.id);
        });
      }
    })
  )

  _clearTimeout() {
    clearTimeout(this.heartbeatTimer);
    clearTimeout(this.pollTimer);
    this.heartbeatTimer = null;
    this.pollTimer = null;
  }
}
