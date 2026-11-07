import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

export const FXN_DESIGNER_STORAGE_STATE = path.join(__dirname, '.auth/fxnDesigner.json');
export const FXN_SUPPORT_STORAGE_STATE = path.join(__dirname, '.auth/fxnSupport.json');
export const FXN_PLAT_READ_STORAGE_STATE = path.join(__dirname, '.auth/fxnPlatRead.json');

const baseURL = process.env['FXN_BASE_URL'] || 'http://localhost:4000';
const webServerURL = new URL('/api/liveness', baseURL).toString();
const selectedProjects = process.argv.flatMap((argument, index, arguments_) =>
  argument === '--project'
    ? [arguments_[index + 1]]
    : argument.startsWith('--project=')
      ? [argument.slice('--project='.length)]
      : [],
);
const mockedRun = selectedProjects.some((project) => project === 'me2e' || project === 'setup-mocked');

const viewportMediumSize = { width: 1280, height: 720 };
const viewportLargeSize = { width: 1960, height: 1080 };

const standardProjects = [
  {
    name: 'setup-auth',
    testMatch: /[/\\]auth\.setup\.ts$/,
    testDir: './src/test-setup',
    use: {
      ...devices['Desktop Chrome'],
      // It is important to define the `viewport` property after destructuring `devices`,
      // since devices also define the `viewport` for that device.
      viewport: viewportMediumSize,
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
      viewport: viewportMediumSize,
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
      viewport: viewportLargeSize,
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
      ignoreHTTPSErrors: true,
    },
    retries: 2,
  },
];

const mockedProjects = [
  {
    name: 'setup-mocked',
    testMatch: /mocked-auth\.setup\.ts/,
    testDir: './src/test-setup',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'me2e',
    dependencies: ['setup-mocked'],
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
];

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
  projects: [...standardProjects, ...mockedProjects],

  outputDir: '../../results/playwright',

  reporter: [
    process.env.CI ? ['blob', { outputDir: `../../results-${process.env.SHARD_NUM || 0}/playwright` }] : ['list'],
  ],

  webServer: {
    command: 'pnpm start',
    url: webServerURL,
    reuseExistingServer: !mockedRun,
    ...(mockedRun && {
      env: {
        FXN_AUTH_STRATEGY: 'none',
        FXN_API_AUTH_ENABLED: 'false',
        FXN_REST_API_URL: 'http://fake.rest.api.url',
      },
    }),
    cwd: workspaceRoot,
    stdout: 'pipe',
  },
});
