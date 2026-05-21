/* eslint-disable n/no-process-env -- This runs before the config service is initialized so we have to use process.env */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiAuthConfigFactory } from './api-auth.config';

describe('apiAuthConfigFactory', () => {
  const DEFAULT_ENV: NodeJS.ProcessEnv = {
    FXN_API_AUTH_ENABLED: 'true',
    FXN_API_AUTH_TOKEN_URL: 'https://token.example.com',
    FXN_API_AUTH_REQUEST_HEADER_NAME: 'X-Header',
    FXN_API_AUTH_CLIENT_ID: 'test-client-id', //pragma: allowlist-secret not secret
    FXN_API_AUTH_CLIENT_SECRET: 'test-client-secret', //pragma: allowlist-secret not secret
  };

  beforeEach(() => {
    vi.resetAllMocks();

    process.env = { ...process.env, ...DEFAULT_ENV };
  });

  it('returns the default config with auth disabled when FXN_API_AUTH_ENABLED is not set', async () => {
    delete process.env.FXN_API_AUTH_ENABLED;
    delete process.env.FXN_API_AUTH_REQUEST_HEADER_NAME;

    const config = await apiAuthConfigFactory();

    expect(config).toMatchObject({
      authEnabled: false,
      clientId: '',
      clientSecret: '',
      tokenURL: '',
      requestHeaderName: 'Authorization',
    });
  });

  it.each([
    ['true', true],
    ['false', false],
    [undefined, false],
  ])('sets authEnabled correctly when FXN_API_AUTH_ENABLED=%s', async (flag, expected) => {
    if (flag !== undefined) {
      process.env.FXN_API_AUTH_ENABLED = flag as string;
    } else {
      delete process.env.FXN_API_AUTH_ENABLED;
    }

    const config = await apiAuthConfigFactory();
    expect(config.authEnabled).toBe(expected);
  });

  it('uses credentials from the env when auth is enabled', async () => {
    process.env.FXN_API_AUTH_CLIENT_ID = 'test-client-id'; //pragma: allowlist-secret not secret
    process.env.FXN_API_AUTH_CLIENT_SECRET = 'test-client-secret'; //pragma: allowlist-secret not secret

    const config = await apiAuthConfigFactory();

    expect(config.clientId).toBe('test-client-id');
    expect(config.clientSecret).toBe('test-client-secret');
    expect(config.tokenURL).toBe('https://token.example.com');
  });

  it('uses tokenURL and default requestHeaderName when auth is disabled and env values are set', async () => {
    process.env.FXN_API_AUTH_ENABLED = 'false';
    delete process.env.FXN_API_AUTH_REQUEST_HEADER_NAME;

    const config = await apiAuthConfigFactory();

    expect(config.tokenURL).toBe('');
    expect(config.requestHeaderName).toBe('Authorization');
  });

  it('uses custom requestHeaderName when FXN_API_AUTH_REQUEST_HEADER_NAME is set', async () => {
    process.env.FXN_API_AUTH_REQUEST_HEADER_NAME = 'X-Custom-Auth';

    const config = await apiAuthConfigFactory();

    expect(config.requestHeaderName).toBe('X-Custom-Auth');
  });
});
