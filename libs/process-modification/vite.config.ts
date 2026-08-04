import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/process-modification',
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
      '@fxn/common/src': path.resolve(__dirname, '../../libs/common/src'),
      '@fxn/test-support/src': path.resolve(__dirname, '../../libs/test-support/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
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
