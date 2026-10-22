const nxEslintPlugin = require('@nx/eslint-plugin');
const angularEslint = require('angular-eslint');
const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  ...nxEslintPlugin.configs['flat/angular'],
  ...angularEslint.configs.templateRecommended.map((config) => ({
    ...config,
    files: ['**/*.html'],
    rules: {
      ...config.rules,
      '@angular-eslint/template/prefer-control-flow': 'off',
    },
  })),
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'fluxnova',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'fluxnova',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      // Components rely on Eager change detection; see the Angular 22 change-detection-eager migration.
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
];
