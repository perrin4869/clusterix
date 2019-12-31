module.exports = {
  extends: 'plugin:mocha/recommended',
  plugins: ['mocha'],
  env: {
    mocha: true
  },
  rules: {
    'mocha/no-setup-in-describe': 0,
    'mocha/no-mocha-arrows': 0,
    'import/no-extraneous-dependencies': [2, { devDependencies: true }],
  },
};
