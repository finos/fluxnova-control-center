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
    // otel-setup runs before Nest's ConfigService exists; specs need to stub env vars
    files: ['**/*.spec.ts', '**/otel/otel-setup.ts'],
    rules: {
      'n/no-process-env': 'off',
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
