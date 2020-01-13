const getTargetNode = env => env === 'test' ? 'current' : '8';

module.exports = api => ({
  presets: [['@babel/env', { targets: { node: getTargetNode(api.env()) } }]],
  plugins: [
    '@babel/proposal-class-properties',
    api.env() === 'test' && 'istanbul',
  ].filter(Boolean),
});
