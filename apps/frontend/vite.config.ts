import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/frontend',
  plugins: [
    nxViteTsPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.spec.json'),
    }),
    angular(),
  ],
  resolve: {
    alias: {
      '@fxn/types/src': path.resolve(__dirname, '../../libs/types/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', ['junit', { suiteName: 'frontend' }]],
    outputFile: {
      junit: '../../results/unit/apps/frontend/junit.xml',
    },
    coverage: {
      enabled: true,
      reportsDirectory: '../../results/coverage/apps/frontend',
      provider: 'istanbul',
      reporter: ['lcov'],
      thresholds: {
        lines: 80,
      },
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
