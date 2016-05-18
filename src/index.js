import Promise from 'bluebird';
import { EventEmitter } from 'events';

export default class Clusterix extends EventEmitter {
  constructor() {
    super();

    this._nodes = [];
  }

  get nodes() {
    return Promise.resolve(this._nodes);
  }

  initializeNode(id) {
    this._nodes = this._nodes.concat([id]);
    this.emit('new node', id);
  }

  killNode(id) {
    this._nodes = this._nodes.filter(node => node !== id);
    this.emit('node down', id);
  }

  clearAll() {
    this._nodes = [];
  }
}
