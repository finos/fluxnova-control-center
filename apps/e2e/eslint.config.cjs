const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const baseConfig = require('../../eslint.config.cjs');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
    files: ['src/plugins/index.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
    },
  },
  ...compat
    .config({
      extends: ['plugin:playwright/recommended'],
    })
    .map((config) => ({
      ...config,
      files: ['e2e/**/*.{ts,js,tsx,jsx}'],
      rules: {
        ...config.rules,
      },
    })),
  ...compat
    .config({
      extends: ['plugin:playwright/recommended'],
    })
    .map((config) => ({
      ...config,
      files: ['me2e/**/*.{ts,js,tsx,jsx}'],
      rules: {
        ...config.rules,
      },
    })),
];
