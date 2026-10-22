import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/process-modification',
  plugins: [
    tsconfigPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.spec.json'),
    }),
    angular(),
  ],
  resolve: {
    alias: {
      '@fxn/types/src': path.resolve(__dirname, '../../libs/types/src'),
      '@fxn/common/src': path.resolve(__dirname, '../../libs/common/src'),
      '@fxn/test-support/src': path.resolve(__dirname, '../../libs/test-support/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    // CI runners are much slower than dev machines when Nx runs several Vitest projects in parallel.
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ['default', ['junit', { suiteName: 'process-modification' }]],
    outputFile: {
      junit: '../../results/unit/libs/process-modification/junit.xml',
    },
    coverage: {
      enabled: true,
      reportsDirectory: '../../results/coverage/libs/process-modification',
      provider: 'istanbul',
      reporter: ['lcov'],
      thresholds: {
        lines: 80,
      },
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
