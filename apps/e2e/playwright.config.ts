import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as path from 'path';

export const FXN_DESIGNER_STORAGE_STATE = path.join(__dirname, '.auth/fxnDesigner.json');
export const FXN_SUPPORT_STORAGE_STATE = path.join(__dirname, '.auth/fxnSupport.json');
export const FXN_PLAT_READ_STORAGE_STATE = path.join(__dirname, '.auth/fxnPlatRead.json');

const baseURL = process.env['FXN_BASE_URL'] || 'http://localhost:4000';

export default defineConfig({
  ...nxE2EPreset(__filename),
  use: {
    baseURL,
    video: 'on-first-retry',
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--ignore-certificate-errors'],
    },
  },
  projects: [
    {
      name: 'setup-auth',
      testMatch: /auth\.setup\.ts/,
      testDir: './src/test-setup',
      use: {
        ...devices['Desktop Chrome'],
        // It is important to define the `viewport` property after destructuring `devices`,
        // since devices also define the `viewport` for that device.
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'setup-deploy',
      dependencies: ['setup-auth'],
      testMatch: /deploy\.setup\.ts/,
      testDir: './src/test-setup',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'e2e',
      dependencies: ['setup-auth', 'setup-deploy'],
      testMatch: '*.ts',
      testDir: './src/e2e',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        storageState: FXN_DESIGNER_STORAGE_STATE,
        viewport: { width: 1960, height: 1080 },
      },
    },
    {
      name: 'me2e',
      dependencies: ['setup-auth'],
      testMatch: '*.ts',
      testDir: './src/mocked-e2e',
      use: {
        ...devices['Desktop Chrome'],
        storageState: FXN_SUPPORT_STORAGE_STATE,
        ignoreHTTPSErrors: true,
        launchOptions: {
          env: {
            ...process.env,
            FXN_TEST_TENANT: '',
          },
        },
      },
    },
    {
      name: 'regression',
      dependencies: ['setup-auth', 'setup-deploy'],
      testMatch: '*.ts',
      testDir: './src/regression',
      use: {
        ...devices['Desktop Chrome'],
        storageState: FXN_DESIGNER_STORAGE_STATE,
      },
      retries: 2,
    },
  ],

  outputDir: '../../results/playwright',

  reporter: [
    process.env.CI ? ['blob', { outputDir: `../../results-${process.env.SHARD_NUM || 0}/playwright` }] : ['list'],
  ],

  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
    stdout: 'pipe',
  },
});
