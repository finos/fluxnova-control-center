import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { of, throwError } from 'rxjs';
import { ForbiddenException, StreamableFile, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, Mocked, MockedFunction, vi } from 'vitest';
import * as fs from 'node:fs';
import { ONE_DAY_IN_SEC, proxyRequest } from '../common';
import { getMockConfigService } from '../test-support/config';
import { EngineController } from '../fluxnova/engine/engine.controller';
import { AuthController } from './auth.controller';
import { OidcAuthStrategyService } from './strategies/oidc.auth-strategy.service';

vi.mock('jsonwebtoken');
vi.mock('../logging');
vi.mock('../common/proxy-request');
vi.mock('fs', () => ({
  createReadStream: vi.fn(() => ({ on: vi.fn() })),
}));

const createReadStreamMock = vi.spyOn(fs, 'createReadStream');

const mockHttpService: Mocked<HttpService> = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as Mocked<HttpService>;

let mockReq: Mocked<Request>;
const mockRes: Mocked<Response> = { redirect: vi.fn(), setHeader: vi.fn() } as unknown as Mocked<Response>;

describe('AuthController', () => {
  let module: TestingModule;
  let controller: AuthController;
  let configService: ConfigService;

  const mockOidcAuthStrategy = {
    getClient: vi.fn().mockResolvedValue(this),
    handleCallback: vi.fn(),
    ssoLogin: vi.fn(),
    userCredentialsLogin: vi.fn(),
    getUserNameFromTokenClaims: vi.fn((preferredUsername: string) => preferredUsername),
  };

  const mockEngineController = {
    engines: vi.fn().mockReturnValue([{}]),
  };

  // Helper function to create the testing module with current config state
  async function createTestingModule() {
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: EngineController, useValue: mockEngineController },
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: OidcAuthStrategyService, useValue: mockOidcAuthStrategy },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  }

  beforeEach(async () => {
    configService = getMockConfigService();
    configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '^(usr\\d{4})(?:@.*)?$');
    configService.set('FXN_AUTH_STRATEGY', 'oidc');

    await createTestingModule();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('/auth', () => {
    mockReq = { session: { user: { token: 'asdf' } } } as unknown as Mocked<Request>;

    it('should have engine info in the response', async () => {
      await expect(controller.getAuth(mockReq)).resolves.toEqual(
        expect.objectContaining({
          user: {
            id: undefined,
            fullName: undefined,
            engines: [{}],
          },
        }),
      );
    });

    it('should set the user to anonymous when AuthStrategy is None', async () => {
      configService = getMockConfigService();
      configService.set('FXN_AUTH_STRATEGY', 'none');
      await createTestingModule();
      await expect(controller.getAuth(mockReq)).resolves.toEqual(
        expect.objectContaining({
          user: {
            id: 'anonymous',
            fullName: 'Anonymous User',
            engines: [{}],
          },
        }),
      );
    });

    it('should throw ForbiddenException if there are no engines', async () => {
      mockEngineController.engines.mockReturnValueOnce([]);
      await expect(controller.getAuth(mockReq)).rejects.toThrowError(ForbiddenException);
    });
  });

  describe('/login', () => {
    beforeEach(() => {
      mockReq = { session: {} } as unknown as Mocked<Request>;
      mockReq.body = { username: 'jeffrey', password: 'asdf' }; //pragma: allowlist-secret not secret
      mockOidcAuthStrategy.userCredentialsLogin.mockResolvedValue({
        account: { username: 'jeffrey', name: 'Jeffrey Whatshisname' },
        idToken: 'test-token',
      } as any);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should do clientCredentials login with msal', async () => {
      configService = getMockConfigService();
      configService.set('FXN_AUTH_STRATEGY', 'oidc');
      await createTestingModule();

      await controller.login(mockReq, mockRes, mockReq.body);

      expect(mockOidcAuthStrategy.userCredentialsLogin).toHaveBeenCalledWith('jeffrey', 'asdf');
      expect(mockReq.session).toEqual(
        expect.objectContaining({
          user: { id: 'jeffrey', fullName: 'Jeffrey Whatshisname', token: 'test-token' },
          id: expect.any(String),
        }),
      );
    });

    it('should send an UnauthorizedException on authentication failure', async () => {
      mockOidcAuthStrategy.userCredentialsLogin.mockRejectedValue(new Error('Network Error'));

      await expect(controller.login(mockReq, mockRes, mockReq.body)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('/logout', () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
      configService.set('PUBLIC_URL', 'http://example.com/whatever');
      req = {
        query: {},
        session: {
          userId: 'asdf',
        },
      } as unknown as Request;
      res = {
        redirect: vi.fn(),
        setHeader: vi.fn(),
      } as unknown as Response;
    });

    afterEach(() => vi.resetAllMocks());

    it('should clear the session', () => {
      controller.logout(req, res);
      expect(req.session).toEqual(null);
    });

    it('should redirect to /login', () => {
      controller.logout(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('/callback', () => {
    beforeEach(() => {
      mockReq = { path: 'test', query: {} } as unknown as Mocked<Request>;
    });
    afterEach(() => vi.resetAllMocks());

    it('should delegate to the auth service to handle the callback', () => {
      controller.callback(mockReq, mockRes);
      expect(mockOidcAuthStrategy.handleCallback).toHaveBeenCalled();
    });

    it('on error it should redirect to /login if no returnTo set', () => {
      mockOidcAuthStrategy.handleCallback.mockImplementation(() => {
        throw new Error('test error');
      });
      controller.callback(mockReq, mockRes);
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('/profile-images/:userId', () => {
    const mockResponse = {
      sendFile: vi.fn(),
      setHeader: vi.fn(),
    } as any;
    const mockStream = { data: 'totally a real stream' }; // Axios stream, not got
    const mockProxyRequest = proxyRequest as MockedFunction<typeof proxyRequest>;

    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(mockHttpService.get).mockReturnValue(of({ data: mockStream } as AxiosResponse));
    });

    describe('with all environment variables set', () => {
      beforeEach(async () => {
        configService.set('FXN_PROFILE_IMG_URL', 'https://example.com/images');
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'png');
        await createTestingModule();
      });
      it('should proxy the profile image request with pattern matching and extraction', async () => {
        await controller.handleProfileImages('usr1234@example.com', mockResponse);

        expect(createReadStreamMock).toHaveBeenCalledTimes(0);
        expect(mockHttpService.get).toHaveBeenCalledTimes(1);
        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/usr1234.png',
          expect.objectContaining({ responseType: 'stream', skipDefaultAuth: true }),
        );
        expect(mockProxyRequest).toHaveBeenCalledTimes(1);
        expect(mockProxyRequest).toHaveBeenCalledWith(mockStream, mockResponse, ONE_DAY_IN_SEC);
      });

      it('should use captured group from pattern when userId matches pattern', async () => {
        await controller.handleProfileImages('usr1234@domain.com', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/usr1234.png',
          expect.objectContaining({ responseType: 'stream' }),
        );
        expect(mockProxyRequest).toHaveBeenCalledTimes(1);
      });

      it('should return default image when userId does not match pattern', async () => {
        const result = await controller.handleProfileImages('invalid-id', mockResponse);

        expect(mockHttpService.get).not.toHaveBeenCalled();
        expect(mockProxyRequest).not.toHaveBeenCalled();
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age='));
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
        expect(result).toBeInstanceOf(StreamableFile);
        expect(createReadStreamMock).toHaveBeenCalledTimes(1);
      });

      it("should use a generic user image when the profile image can't be loaded", async () => {
        vi.mocked(mockHttpService.get).mockReturnValue(throwError(() => new Error('simulating an error')));

        const result = await controller.handleProfileImages('usr1234', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledTimes(1);
        expect(mockProxyRequest).toHaveBeenCalledTimes(0);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age='));
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
        expect(result).toBeInstanceOf(StreamableFile);
      });
    });

    describe('without pattern (FXN_PROFILE_IMG_USER_ID_PATTERN not set)', () => {
      beforeEach(async () => {
        configService.set('FXN_PROFILE_IMG_URL', 'https://example.com/images');
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'png');
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', ''); // No pattern
        await createTestingModule();
      });

      it('should use the userId as-is without pattern matching', async () => {
        await controller.handleProfileImages('any-user-id-123', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/any-user-id-123.png',
          expect.objectContaining({ responseType: 'stream', skipDefaultAuth: true }),
        );
        expect(mockProxyRequest).toHaveBeenCalledTimes(1);
      });

      it('should work with userId containing @ symbol when no pattern is set', async () => {
        await controller.handleProfileImages('user@domain.com', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/user@domain.com.png',
          expect.objectContaining({ responseType: 'stream' }),
        );
        expect(mockProxyRequest).toHaveBeenCalledTimes(1);
      });

      it('should work with any format userId when no pattern validation is required', async () => {
        await controller.handleProfileImages('b999999', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/b999999.png',
          expect.objectContaining({ responseType: 'stream' }),
        );
        expect(mockProxyRequest).toHaveBeenCalledTimes(1);
      });
    });

    describe('with custom file extension', () => {
      it('should use default extension (png) when FXN_PROFILE_IMG_FILE_EXTENSION is not set', async () => {
        configService.set('FXN_PROFILE_IMG_URL', 'https://example.com/images');
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '');
        await createTestingModule();

        await controller.handleProfileImages('usr1234', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/usr1234.png', expect.anything());
      });

      it('should use custom extension when FXN_PROFILE_IMG_FILE_EXTENSION is set', async () => {
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'jpg');

        await controller.handleProfileImages('usr1234', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/usr1234.jpg', expect.anything());
      });

      it('should support various image formats', async () => {
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'webp');

        await controller.handleProfileImages('usr1234', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/usr1234.webp', expect.anything());
      });
    });

    describe('without FXN_PROFILE_IMG_URL (missing required env)', () => {
      beforeEach(async () => {
        configService.set('FXN_PROFILE_IMG_URL', ''); // Missing required var
        await createTestingModule();
      });

      it('should return default image when PROFILE_IMG_URL is not set', async () => {
        const result = await controller.handleProfileImages('usr1234', mockResponse);

        expect(mockHttpService.get).not.toHaveBeenCalled();
        expect(mockProxyRequest).not.toHaveBeenCalled();
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age='));
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
        expect(result).toBeInstanceOf(StreamableFile);
        expect(createReadStreamMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('edge cases', () => {
      beforeEach(async () => {
        configService.set('FXN_PROFILE_IMG_URL', 'https://example.com/images');
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'png');
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', ''); // No pattern for these tests
        await createTestingModule();
      });

      it('should handle empty userId', async () => {
        await controller.handleProfileImages('', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/.png', expect.anything());
      });

      it('should handle userId with special characters when no pattern is set', async () => {
        await controller.handleProfileImages('user+test@example.com', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith(
          'https://example.com/images/user+test@example.com.png',
          expect.anything(),
        );
      });

      it('should extract only the capturing group even if userId has additional matching text', async () => {
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '^(usr\\d{4})(?:@.*)?$');
        await createTestingModule();

        await controller.handleProfileImages('usr1234@long.domain.example.com', mockResponse);

        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/usr1234.png', expect.anything());
      });
    });

    describe('regex pattern validation', () => {
      it('should reject unsafe regex patterns with nested quantifiers', async () => {
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '(a+)+');
        await createTestingModule();

        // Pattern should be rejected, so it should act as if no pattern is set
        expect((controller as any).profileImgUserIdRegex).toBeNull();
      });

      it('should reject invalid regex patterns with syntax errors', async () => {
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '(((');
        await createTestingModule();

        expect((controller as any).profileImgUserIdRegex).toBeNull();
      });

      it('should accept safe regex patterns', async () => {
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '^([aA]\\d{6})(?:@.*)?$');
        await createTestingModule();

        expect((controller as any).profileImgUserIdRegex).toBeInstanceOf(RegExp);
      });

      it('should use default behavior when pattern is rejected for being unsafe', async () => {
        configService.set('FXN_PROFILE_IMG_URL', 'https://example.com/images');
        configService.set('FXN_PROFILE_IMG_FILE_EXTENSION', 'png');
        configService.set('FXN_PROFILE_IMG_USER_ID_PATTERN', '(a+)+'); // Unsafe pattern
        await createTestingModule();

        // Since pattern is rejected, any userId should work (no validation)
        await controller.handleProfileImages('any-id', mockResponse);

        // Should use the userId as-is since pattern was rejected
        expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/images/any-id.png', expect.anything());
      });
    });
  });

  describe('/sso', () => {
    beforeEach(() => {
      mockReq = { session: {} } as unknown as Mocked<Request>;
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should call handleSSO on the auth strategy', async () => {
      await controller.sso(mockReq, mockRes);

      expect(mockOidcAuthStrategy.ssoLogin).toHaveBeenCalledWith(mockReq, mockRes);
    });
  });
});
