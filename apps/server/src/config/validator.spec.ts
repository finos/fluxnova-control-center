import { describe, expect, it } from 'vitest';
import { AuthStrategy } from '../auth/strategies/strategies.enum';
import { validate } from './validator';

describe('validate', () => {
  it('throws error if OIDC auth is enabled and required vars are missing', () => {
    const env = {
      FXN_AUTH_STRATEGY: AuthStrategy.oidc,
    };

    expect(() => validate(env)).toThrow(
      /OIDC Authentication is enabled but FXN_OIDC_AUTHORITY, FXN_OIDC_AUTH_URL, FXN_OIDC_CLIENT_ID, FXN_OIDC_CLIENT_SECRET, FXN_OIDC_ISSUER, FXN_OIDC_TOKEN_URL, FXN_OIDC_USERINFO_URL are missing/,
    );
  });

  it('does not throw if OIDC auth is enabled and all vars are set', () => {
    const env = {
      FXN_AUTH_STRATEGY: AuthStrategy.oidc,
      FXN_OIDC_AUTHORITY: 'authority',
      FXN_OIDC_AUTH_URL: 'url',
      FXN_OIDC_CLIENT_ID: 'id',
      FXN_OIDC_CLIENT_SECRET: 'secret',
      FXN_OIDC_ISSUER: 'issuer',
      FXN_OIDC_TOKEN_URL: 'token',
      FXN_OIDC_USERINFO_URL: 'userinfo',
    };

    expect(() => validate(env)).not.toThrow();
  });

  it('throws error if API auth is enabled and required vars are missing', () => {
    const env = {
      FXN_API_AUTH_ENABLED: 'true',
      FXN_API_AUTH_CLIENT_ID: '',
      FXN_API_AUTH_CLIENT_SECRET: '',
      FXN_API_AUTH_TOKEN_URL: '',
    };

    expect(() => validate(env)).toThrow(
      /API Authentication is enabled but FXN_API_AUTH_CLIENT_ID, FXN_API_AUTH_CLIENT_SECRET, FXN_API_AUTH_TOKEN_URL are missing/,
    );
  });

  it('does not throw if API auth is enabled and all vars are set', () => {
    const env = {
      FXN_API_AUTH_ENABLED: 'true',
      FXN_API_AUTH_CLIENT_ID: 'id',
      FXN_API_AUTH_CLIENT_SECRET: 'secret',
      FXN_API_AUTH_TOKEN_URL: 'token',
    };

    expect(() => validate(env)).not.toThrow();
  });

  it('does not throw if neither OIDC nor API auth is enabled', () => {
    const env = {};

    expect(() => validate(env)).not.toThrow();
  });

  it('throws error if not running locally and FXN_CSRF_KEY is missing', async () => {
    const env = {
      FXN_PUBLIC_URL: 'fluxnova.finos.org',
    };
    expect(() => validate(env)).toThrow(/Application is not running locally but FXN_CSRF_KEY is missing/);
  });

  it('does not throw if not running locally and FXN_CSRF_KEY is set', async () => {
    const env = { FXN_PUBLIC_URL: 'fluxnova.finos.org', FXN_CSRF_KEY: 'key' };
    expect(() => validate(env)).not.toThrow();
  });

  it('does not throw if running locally and FXN_CSRF_KEY is missing', async () => {
    let env = {};
    expect(() => validate(env)).not.toThrow();

    env = { FXN_PUBLIC_URL: 'localhost' };
    expect(() => validate(env)).not.toThrow();
  });
});
