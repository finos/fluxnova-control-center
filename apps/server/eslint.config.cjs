const baseConfig = require('../../eslint.config.cjs');
const nEslintPlugin = require('eslint-plugin-n');

module.exports = [
  {
    ignores: ['**/dist'],
  },
  {
    plugins: {
      n: nEslintPlugin,
    },
  },
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      'no-console': 'error',
      'n/no-process-env': 'warn',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.js'],
    // Override or add rules here
    rules: {},
  },
];
