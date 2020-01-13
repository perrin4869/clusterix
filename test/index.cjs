const Redis = require('ioredis');

const { spy } = require('sinon');
const { expect } = require('chai');
const delay = require('delay');
const { install: pdel } = require('redis-pdel');

const Clusterix = require('..');

describe('clusterix', () => {
  let clusterInstances;

  const interval = 100;
  const pollInterval = interval;
  const heartbeatInterval = interval;
  const timeout = interval * 2;
  const redis = new Redis({ keyPrefix: 'clusterix:test:' });

  pdel(redis);

  const initializeTestNodes = (count = 3) => [...Array(count).keys()].map(
    (i) => new Clusterix(redis, { pollInterval, timeout }).initializeNode(`node${i + 1}`, { heartbeatInterval }),
  );

  beforeEach(() => redis.pdel('*'));
  afterEach(() => clusterInstances.forEach((cluster) => cluster.dispose()));
  after(() => redis.disconnect());

  it('should properly create cluster of 3 nodes', async () => {
    clusterInstances = await Promise.all(initializeTestNodes());

    return clusterInstances.map((cluster) => expect(cluster.nodes).to.become([
      'node1',
      'node2',
      'node3',
    ]));
  });

  it('should detect dead node', async () => {
    const node = 'node3';
    const nodeDown = spy();
    clusterInstances = await Promise.all(initializeTestNodes());
    clusterInstances[0].on('node down', nodeDown);
    clusterInstances[1].on('node down', nodeDown);
    clusterInstances[2].dispose();

    await delay(timeout * 2);

    expect(nodeDown).to.have.been.calledOnceWithExactly(node);

    return clusterInstances.map((cluster) => expect(cluster.nodes).to.become([
      'node1',
      'node2',
    ]));
  });
});
