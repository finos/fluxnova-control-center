/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/server',
  plugins: [
    tsconfigPaths(),
    dts({
      entryRoot: 'src',
      tsConfigFilePath: path.join(__dirname, 'tsconfig.spec.json'),
      skipDiagnostics: true,
    }),
    swc.vite({
      module: {
        type: 'es6',
      },
    }),
  ],
  test: {
    env: {
      FXN_AUTH_STRATEGY: 'none',
      FXN_API_AUTH_ENABLED: 'false',
    },
    globals: true,
    cacheDir: '../../node_modules/.vitest/apps/server',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', ['junit', { suiteName: 'server' }]],
    outputFile: {
      junit: '../../results/unit/apps/server/junit.xml',
    },
    coverage: {
      enabled: true,
      exclude: ['src/fluxnova/generated/**'],
      reportsDirectory: '../../results/coverage/apps/server',
      provider: 'istanbul',
      reporter: ['lcov'],
      thresholds: {
        lines: 80,
      },
    },
  },
});
