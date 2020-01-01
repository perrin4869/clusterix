import babel from 'rollup-plugin-babel';

const input = 'src/index.js';
const plugins = [
  babel({ exclude: '**/node_modules/**' }),
];

const external = (id) => !id.startsWith('.') && !id.startsWith('/');

export default [{
  external,
  input,
  output: { file: 'commonjs/entry.js', format: 'cjs' },
  plugins,
}, {
  external,
  input,
  output: { file: 'esm/entry.mjs', format: 'esm' },
  plugins,
}];
