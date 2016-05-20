import Clusterix from '../src';
import Promise from 'bluebird';
import Redis from 'ioredis';

import sinon from 'sinon';
import { expect } from 'chai';
import { install as pdel } from 'redis-pdel';

describe('clusterix', () => {
  const interval = 100;
  const pollInterval = interval;
  const heartbeatInterval = interval;
  const timeout = interval * 2;
  const redis = new Redis({ keyPrefix: 'clusterix:test:' });

  pdel(redis);

  async function initializeTestNodes(count = 3) {
    let clusterInstances = [];

    for (let i = 0; i < count; i++) {
      const cluster = new Clusterix(redis, { pollInterval, timeout });
      await cluster.initializeNode(`node${i + 1}`, { heartbeatInterval });
      clusterInstances = clusterInstances.concat([cluster]);
    }

    return clusterInstances;
  }

  function killTestNodes(clusterInstances) {
    clusterInstances.forEach(cluster => cluster.killNode());
  }

  beforeEach(async () => await redis.pdel('*'));
  after(() => redis.disconnect());

  it('should properly create cluster of 3 nodes', async function() {
    const clusterInstances = await initializeTestNodes();

    for (const cluster of clusterInstances) {
      expect(await cluster.nodes).to.deep.equal([
        'node1',
        'node2',
        'node3',
      ]);
    }

    killTestNodes(clusterInstances);
  });

  it('should detect dead node', async function() {
    const node = 'node3';
    const spy = sinon.spy();
    const clusterInstances = await initializeTestNodes();
    clusterInstances[0].on('node down', spy);
    clusterInstances[1].on('node down', spy);
    clusterInstances[2].killNode();

    await Promise.delay(timeout * 2);

    expect(spy.calledOnce).to.equal(true);
    expect(spy.firstCall.args).to.deep.equal([node]);

    for (const cluster of clusterInstances) {
      expect(await cluster.nodes).to.deep.equal([
        'node1',
        'node2',
      ]);
    }

    killTestNodes(clusterInstances);
  });
});
