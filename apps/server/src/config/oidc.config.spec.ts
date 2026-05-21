/* eslint-disable n/no-process-env -- This runs before the config service is initialized so we have to use process.env */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { oidcConfigFactory } from './oidc.config';

describe('oidcConfigFactory', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns config with all defaults when no env vars are set', async () => {
    delete process.env.FXN_OIDC_KNOWN_AUTHORITIES;
    delete process.env.FXN_OIDC_AUTHORITY;
    delete process.env.FXN_OIDC_AUTH_URL;
    delete process.env.FXN_OIDC_CLIENT_ID;
    delete process.env.FXN_OIDC_CLIENT_SECRET;
    delete process.env.FXN_PUBLIC_URL;
    delete process.env.FXN_OIDC_ISSUER;
    delete process.env.FXN_OIDC_SCOPE;
    delete process.env.FXN_OIDC_TOKEN_URL;
    delete process.env.FXN_OIDC_USERINFO_URL;

    const config = await oidcConfigFactory();
    expect(config).toMatchObject({
      authority: undefined,
      authorizationURL: undefined,
      callbackURL: expect.stringContaining('/callback'),
      clientId: undefined,
      clientSecret: undefined,
      issuer: undefined,
      knownAuthorities: [],
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      tokenURL: undefined,
      userInfoURL: undefined,
    });
  });

  it('parses known authorities from FXN_OIDC_KNOWN_AUTHORITIES', async () => {
    process.env.FXN_OIDC_KNOWN_AUTHORITIES = 'a.com,b.com';
    const config = await oidcConfigFactory();
    expect(config.knownAuthorities).toEqual(['a.com', 'b.com']);
  });

  it('uses FXN_OIDC_AUTHORITY for authority and knownAuthorities', async () => {
    process.env.FXN_OIDC_AUTHORITY = 'https://auth.example.com';
    const config = await oidcConfigFactory();
    expect(config.authority).toBe('https://auth.example.com');
    expect(config.knownAuthorities).toEqual(['https://auth.example.com']);
  });

  it('parses scopes from FXN_OIDC_SCOPE', async () => {
    process.env.FXN_OIDC_SCOPE = 'openid,email';
    const config = await oidcConfigFactory();
    expect(config.scopes).toEqual(['openid', 'email']);
  });

  it('uses FXN_PUBLIC_URL for callbackURL', async () => {
    process.env.FXN_PUBLIC_URL = 'https://fluxnova.finos.org';
    const config = await oidcConfigFactory();
    expect(config.callbackURL).toBe('https://fluxnova.finos.org/api/callback');
  });

  it('uses all OIDC env vars if set', async () => {
    process.env.FXN_OIDC_AUTHORITY = 'https://auth';
    process.env.FXN_OIDC_AUTH_URL = 'https://authz';
    process.env.FXN_PUBLIC_URL = 'https://pub';
    process.env.FXN_OIDC_ISSUER = 'https://issuer';
    process.env.FXN_OIDC_SCOPE = 'openid,profile';
    process.env.FXN_OIDC_TOKEN_URL = 'https://token';
    process.env.FXN_OIDC_USERINFO_URL = 'https://userinfo';
    process.env.FXN_OIDC_CLIENT_ID = 'test-client-id'; //pragma: allowlist-secret not secret
    process.env.FXN_OIDC_CLIENT_SECRET = 'test-client-secret'; //pragma: allowlist-secret not secret
    const config = await oidcConfigFactory();
    expect(config).toMatchObject({
      authority: 'https://auth',
      authorizationURL: 'https://authz',
      callbackURL: 'https://pub/api/callback',
      issuer: 'https://issuer',
      scopes: ['openid', 'profile'],
      tokenURL: 'https://token',
      userInfoURL: 'https://userinfo',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });
  });
});
