// TODO: Remove plugin once babel parser can understand class properties by default
const plugins = ['@babel/syntax-class-properties'];

module.exports = ({ env }) => env('test')
  ? { plugins: [...plugins, 'istanbul'] }
  : { plugins: [...plugins, 'static-fs'] };
