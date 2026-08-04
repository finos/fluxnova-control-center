const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const nxEslintPlugin = require('@nx/eslint-plugin');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['**/dist'],
  },
  { plugins: { '@nx': nxEslintPlugin } },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:server',
              onlyDependOnLibsWithTags: ['scope:server', 'scope:shared'],
            },
            {
              sourceTag: 'scope:client',
              onlyDependOnLibsWithTags: ['scope:client', 'scope:shared'],
            },
            {
              sourceTag: 'scope:e2e',
              onlyDependOnLibsWithTags: ['scope:e2e', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
      'max-lines': ['warn', 400],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines': ['error', 1000],
    },
  },
  ...compat
    .config({
      extends: ['plugin:@nx/typescript'],
      plugins: ['eslint-plugin-import', '@angular-eslint/eslint-plugin', '@typescript-eslint'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
      rules: {
        ...config.rules,
        '@typescript-eslint/no-empty-function': 'off',
        'import/no-deprecated': 'error',
        'import/order': [
          'error',
          {
            groups: [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          },
        ],
        'sort-imports': ['error', {
          'ignoreDeclarationSort': true,
          'ignoreCase': true,
        }],
        'no-restricted-syntax': 'off',
        '@angular-eslint/no-conflicting-lifecycle': 'error',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@angular-eslint/no-output-native': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/no-outputs-metadata-property': 'error',
        '@angular-eslint/use-lifecycle-interface': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/explicit-member-accessibility': [
          'off',
          {
            accessibility: 'explicit',
          },
        ],
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-inferrable-types': [
          'error',
          {
            ignoreParameters: true,
          },
        ],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-shadow': [
          'error',
          {
            hoist: 'all',
          },
        ],
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-body-style': 'error',
        'constructor-super': 'error',
        eqeqeq: ['error', 'smart'],
        'guard-for-in': 'error',
        'id-blacklist': 'off',
        'id-match': 'off',
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-debugger': 'error',
        'no-empty': 'off',
        'no-eval': 'error',
        'no-fallthrough': 'error',
        'no-new-wrappers': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              'rxjs/Rx',
              {
                name: 'lodash-es',
                importNames: ['chain'],
                message: 'Do not use chain, as it requires bundling the entire lodash-es library',
              },
            ],
          },
        ],
        'no-undef-init': 'error',
        'no-underscore-dangle': 'off',
        'no-var': 'error',
        'prefer-const': 'error',
        radix: 'error',
        'no-extra-semi': 'off',
        'max-len': ['warn', { code: 120, tabWidth: 2 }],
      },
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
    })),
  ...compat
    .config({
      plugins: ['@angular-eslint/eslint-plugin-template'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.html'],
      rules: {
        ...config.rules,
        '@angular-eslint/template/banana-in-box': 'error',
        '@angular-eslint/template/no-negated-async': 'error',
        '@angular-eslint/template/eqeqeq': 'error',
        'max-len': ['warn', { code: 120, tabWidth: 2 }],
      },
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/javascript'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
      rules: {
        ...config.rules,
        'no-extra-semi': 'off',
        'max-len': ['warn', { code: 120, tabWidth: 2 }],
      },
    })),
  {
    ignores: ['**/generated/**'],
  },
];
