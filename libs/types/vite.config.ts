import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/types',
  plugins: [
    nxViteTsPaths(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.spec.json'),
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', ['junit', { suiteName: 'types' }]],
    outputFile: {
      junit: '../../results/unit/libs/types/junit.xml',
    },
    coverage: {
      enabled: true,
      reportsDirectory: '../../results/coverage/libs/types',
      provider: 'istanbul',
      reporter: ['lcov'],
    },
  },
});
