import cookieSession from 'cookie-session';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, Mocked, MockedFunction, vi } from 'vitest';
import { getMockConfigService } from '../../test-support/config';
import { SignedSessionCookieMiddleware } from './signed-session-cookie.middleware';

vi.mock('cookie-session');
vi.mock('../../logging');

describe('session', () => {
  const mockedCookieSession = cookieSession as MockedFunction<typeof cookieSession>;
  const mockCookieSessionInstance = vi.fn();

  let module: TestingModule;
  let signedSessionCookieMiddleware: SignedSessionCookieMiddleware;
  let configService: Mocked<ConfigService>;

  beforeEach(async () => {
    configService = getMockConfigService();

    module = await Test.createTestingModule({
      providers: [{ provide: ConfigService, useValue: configService }, SignedSessionCookieMiddleware],
    }).compile();

    signedSessionCookieMiddleware = module.get<SignedSessionCookieMiddleware>(SignedSessionCookieMiddleware);

    mockedCookieSession.mockReturnValue(mockCookieSessionInstance);
    configService.get.mockReturnValue(undefined);
  });

  afterEach(() => vi.resetAllMocks());

  describe('cookie session middleware', () => {
    it('should get session cookie middleware with 30 minute max age and keys from configService', async () => {
      configService.get.mockImplementation((key: never, defaultValue: unknown) => defaultValue);
      await signedSessionCookieMiddleware.use({}, {}, () => {});
      expect(mockedCookieSession).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'fluxnova-ui',
          maxAge: 1000 * 60 * 30,
          sameSite: 'lax',
        }),
      );
    });

    it('should use configService for cookie keys', async () => {
      configService.get.mockReturnValue('key1,key2');

      await signedSessionCookieMiddleware.use({}, {}, () => {});

      expect(mockedCookieSession).toHaveBeenCalledWith(
        expect.objectContaining({
          keys: ['key1', 'key2'],
        }),
      );
      expect(configService.get).toHaveBeenCalledWith('FXN_COOKIE_KEYS', 'super secret key 1,super secret key 2');

      configService.get.mockRestore();
    });

    it('should use defaults for keys if not found in configService', async () => {
      configService.get.mockImplementation((key: never, defaultValue: unknown) => {
        if (key === 'FXN_COOKIE_KEYS') return defaultValue;
        return undefined;
      });

      await signedSessionCookieMiddleware.use({}, {}, () => {});

      expect(mockedCookieSession).toHaveBeenCalledWith(
        expect.objectContaining({
          keys: ['super secret key 1', 'super secret key 2'],
        }),
      );
      expect(configService.get).toHaveBeenCalledWith('FXN_COOKIE_KEYS', 'super secret key 1,super secret key 2');

      configService.get.mockRestore();
    });
  });
});
