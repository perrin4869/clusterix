import Clusterix from '../src';
import Promise from 'bluebird';

import sinon from 'sinon';
import { expect } from 'chai';

describe('clusterix', () => {
  const timeout = 500;
  const instancesCount = 3;
  let cluster = null;

  async function initializeTestNodes() {
    cluster = new Clusterix();

    for (let i = 0; i < instancesCount; i++) {
      cluster.initializeNode(`node${i + 1}`);
    }

    expect(await cluster.nodes).to.deep.equal([
      'node1',
      'node2',
      'node3',
    ]);
  }

  function clearTestNodes() {
    cluster.clearAll();
  }

  beforeEach(() => initializeTestNodes());
  afterEach(() => clearTestNodes());

  it('should detect new node', async function() {
    const node = 'node4';
    const spy = sinon.spy();
    cluster.on('new node', spy);
    cluster.initializeNode(node);

    await Promise.delay(timeout);

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args).to.deep.equal([node]);
    expect(await cluster.nodes).to.deep.equal([
      'node1',
      'node2',
      'node3',
      'node4',
    ]);
  });

  it('should detect dead node', async function() {
    const node = 'node1';
    const spy = sinon.spy();
    cluster.on('node down', spy);
    cluster.killNode(node);

    await Promise.delay(timeout);

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args).to.deep.equal([node]);
    expect(await cluster.nodes).to.deep.equal([
      'node2',
      'node3',
    ]);
  });
});
