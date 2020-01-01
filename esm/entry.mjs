import { EventEmitter } from 'events';
import os from 'os';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const defaultNodeId = () => `${os.hostname()}:${process.env.PORT}`;

class index extends EventEmitter {
  constructor(redis, {
    id = null,
    pollInterval = 500,
    timeout = 1000
  } = {}) {
    super();

    _defineProperty(this, "heartbeat", () => this.redis.hset(this.redisKey('heartbeats'), this.nodeId, Date.now()).then(initialized => {
      if (initialized) this.emit('reconnect');
    }));

    _defineProperty(this, "poll", () => this.redis.hgetall(this.redisKey('heartbeats')).then(heartbeats => Promise.all(Object.keys(heartbeats).filter(nodeid => Date.now() - parseInt(heartbeats[nodeid], 10) > this.timeout).map(nodeid => this.redis.hdel(this.redisKey('heartbeats'), nodeid).then(deleted => deleted && this.emit('node down', nodeid))))));

    this.id = id;
    this.redis = redis;
    this.timeout = timeout;
    this.pollTimer = setInterval(this.poll, pollInterval);
  }

  get nodes() {
    return this.redis.hkeys(this.redisKey('heartbeats'));
  }

  redisKey(key) {
    return this.id && this.id.length ? `${this.id}:${key}` : key;
  }

  initializeNode(nodeId = defaultNodeId(), {
    heartbeatInterval = 500
  } = {}) {
    if (heartbeatInterval > this.timeout) throw new Error('Interval should be less than timeout');
    return this.redis.hset(this.redisKey('heartbeats'), nodeId, Date.now()).then(initialized => {
      if (initialized) {
        // key was added
        this.nodeId = nodeId;
        this.heartbeatTimer = setInterval(this.heartbeat, heartbeatInterval);
        return this;
      } // initialized === 0, key already existed


      throw new Error('Node with this id already existed');
    });
  }

  dispose() {
    clearTimeout(this.heartbeatTimer);
    clearTimeout(this.pollTimer);
    this.heartbeatTimer = null;
    this.pollTimer = null;
  }

}

export default index;
