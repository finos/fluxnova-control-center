import { AuthenticationResult, ConfidentialClientApplication, ProtocolMode } from '@azure/msal-node';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { OIDCConfig } from '@fxn/types';
import { RequestState } from '../../context';
import { OidcAuthStrategyService } from './oidc.auth-strategy.service';
import type { Request, Response } from 'express';

vi.mock('@azure/msal-node');

describe('OidcAuthStrategyService', () => {
  let axiosInstance: AxiosInstance;
  let service: OidcAuthStrategyService;
  const oidcConfig: OIDCConfig = {
    authority: 'https://example.com/oidc',
    knownAuthorities: ['https://example.com/oidc'],
    authorizationURL: 'https://auth.example.com',
    callbackURL: 'http://localhost:4000/callback',
    issuer: 'https://issuer.example.com',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    tokenURL: 'https://token.example.com',
    userInfoURL: 'https://userinfo.example.com',
  } as OIDCConfig;
  let networkClient: any;

  const mockConfigService = {
    get: vi.fn((key: string) => {
      switch (key) {
        case 'oidc':
          return oidcConfig;
        default:
          return '';
      }
    }),
  } as unknown as Mocked<ConfigService>;

  const mockTokenCache = {
    getAllAccounts: vi.fn(),
  };

  const mockConfidentialClientApplication: Mocked<ConfidentialClientApplication> = {
    acquireTokenByUsernamePassword: vi.fn(),
    acquireTokenByCode: vi.fn(),
    acquireTokenSilent: vi.fn(),
    getAuthCodeUrl: vi.fn(),
    getTokenCache: vi.fn().mockImplementation(() => mockTokenCache),
  } as unknown as Mocked<ConfidentialClientApplication>;

  const mockState = { returnTo: '/test' };

  const encodedState = Buffer.from(JSON.stringify(mockState)).toString('base64');

  const mockRes = {
    send: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const mockMsalReq = {
    session: {
      user: {
        id: 'test',
        token: 'idToken',
      },
    },
    query: {
      code: 'code',
      state: encodedState,
    },
  } as unknown as Mocked<Request & { state?: RequestState }>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [],
      providers: [OidcAuthStrategyService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = moduleRef.get<OidcAuthStrategyService>(OidcAuthStrategyService);

    axiosInstance = service.axiosInstance;
    networkClient = service.msalConfig.system?.networkClient;

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize the msalConfig auth with values from the oidc configuration', () => {
    expect(service.msalConfig).toBeDefined();
    expect(service.msalConfig.auth.clientId).toBe('');
    expect(service.msalConfig.auth.protocolMode).toBe(ProtocolMode.OIDC);
    expect(service.msalConfig.auth.authority).toBe(oidcConfig.authority);
    expect(service.msalConfig.auth.knownAuthorities).toBe(oidcConfig.knownAuthorities);
    expect(JSON.parse(service.msalConfig.auth.authorityMetadata ?? '').authorization_endpoint).toBe(
      oidcConfig.authorizationURL,
    );
    expect(JSON.parse(service.msalConfig.auth.authorityMetadata ?? '').issuer).toBe(oidcConfig.issuer);
    expect(JSON.parse(service.msalConfig.auth.authorityMetadata ?? '').token_endpoint).toBe(oidcConfig.tokenURL);
    expect(JSON.parse(service.msalConfig.auth.authorityMetadata ?? '').userinfo_endpoint).toBe(oidcConfig.userInfoURL);
  });

  it('should initialize the msalConfig networkClient', () => {
    expect(service.msalConfig.system?.networkClient).toBeDefined();
    expect(service.msalConfig.system?.networkClient?.sendGetRequestAsync).toStrictEqual(expect.any(Function));
    expect(service.msalConfig.system?.networkClient?.sendPostRequestAsync).toStrictEqual(expect.any(Function));
  });

  it('should initialize ConfidentialClientApplication', async () => {
    const client = await service.getClient();

    expect(client).toBeInstanceOf(ConfidentialClientApplication);
  });

  describe('when userCredentialsLogin', () => {
    it('is successful, it should return a token', async () => {
      const mockTokenResponse = { accessToken: 'mockAccessToken' } as AuthenticationResult;
      mockConfidentialClientApplication.acquireTokenByUsernamePassword.mockResolvedValue(mockTokenResponse);
      (service as any).confidentialClientApplication = mockConfidentialClientApplication;

      const result = await service.userCredentialsLogin('testUser', 'testPassword');

      expect(result).toEqual(mockTokenResponse);
    });

    it('is unsuccessful, it should not return a token', async () => {
      mockConfidentialClientApplication.acquireTokenByUsernamePassword.mockReturnValue(
        Promise.resolve({} as AuthenticationResult),
      );
      const result = await service.userCredentialsLogin('testUser', 'testPassword');
      expect(result).toBeUndefined();
    });
  });

  describe('ssoLogin', () => {
    it('should redirect to the authorization URL to attempt signin', async () => {
      const mockReq = { session: {}, url: '/test-url' } as any;

      mockConfidentialClientApplication.getAuthCodeUrl.mockResolvedValue('https://auth.url');
      vi.spyOn(service, 'getClient').mockResolvedValue(mockConfidentialClientApplication);

      await service.ssoLogin(mockReq, mockRes);

      expect(mockConfidentialClientApplication.getAuthCodeUrl).toHaveBeenCalledWith({
        scopes: ['openid', 'profile', 'email', 'offline_access'],
        redirectUri: 'http://localhost:4000/callback',
        state: Buffer.from(JSON.stringify({ returnTo: '/test-url' })).toString('base64'),
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('https://auth.url');
    });

    it('should log an error when getAuthCodeUrl throws an exception', async () => {
      const mockReq = { session: {}, url: '/test-url' } as any;
      const loggerSpy = vi.spyOn(service['logger'], 'error');

      mockConfidentialClientApplication.getAuthCodeUrl.mockRejectedValue(new Error('Auth error'));
      vi.spyOn(service, 'getClient').mockResolvedValue(mockConfidentialClientApplication);

      await service.ssoLogin(mockReq, mockRes);

      expect(mockConfidentialClientApplication.getAuthCodeUrl).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith({ error: new Error('Auth error') }, 'oidc auth error');
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });
  });

  describe('handleCallback', () => {
    const mockTokenResponse: any = {
      idToken: 'mockIdToken',
      account: { name: 'testUser', username: 'testUser@domain.com' },
    };
    const next = vi.fn();

    it('should set session data when callback is successful and redirect to returnTo', async () => {
      mockConfidentialClientApplication.acquireTokenByCode.mockResolvedValue(mockTokenResponse);
      vi.spyOn(service, 'getClient').mockResolvedValue(mockConfidentialClientApplication);

      await service.handleCallback(mockMsalReq, mockRes as any);

      expect(mockMsalReq.session?.user.token).toBe('mockIdToken');
      expect(mockMsalReq.session?.user.id).toBe('testUser@domain.com');
      expect(mockMsalReq.session?.id).toBeDefined();
      expect(mockMsalReq.state).toEqual({ returnTo: '/test' });
      expect(mockRes.redirect).toHaveBeenCalledWith('/test');
    });

    it('should log an error and send a 500 response when signin fails', async () => {
      const loggerSpy = vi.spyOn(service['logger'], 'error');

      mockConfidentialClientApplication.acquireTokenByCode.mockRejectedValue(new Error('Callback error'));
      vi.spyOn(service, 'getClient').mockResolvedValue(mockConfidentialClientApplication);

      await service.handleCallback(mockMsalReq, mockRes);

      expect(loggerSpy).toHaveBeenCalledWith({ error: new Error('Callback error') }, 'msal callback error');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('msal callback error');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sendGetRequestAsync', () => {
    it('should return formatted response on success', async () => {
      const mockResp = { headers: { h: 'v' }, data: { foo: 'bar' }, status: 200 };
      vi.spyOn(axiosInstance, 'get').mockResolvedValue(mockResp);

      const result = await networkClient.sendGetRequestAsync('http://test');
      expect(result).toEqual({ headers: mockResp.headers, body: mockResp.data, status: mockResp.status });
      expect(axiosInstance.get).toHaveBeenCalledWith('http://test', expect.objectContaining({ responseType: 'json' }));
    });

    it('should handle errors and return default shape', async () => {
      const err = { response: { headers: { e: 'h' }, data: { err: 'msg' }, status: 404 } };
      vi.spyOn(axiosInstance, 'get').mockRejectedValue(err);

      const result = await networkClient.sendGetRequestAsync('http://fail');
      expect(result).toEqual({ headers: err.response.headers, body: err.response.data, status: err.response.status });
    });
  });

  describe('sendPostRequestAsync', () => {
    it('should return formatted response on success', async () => {
      const mockResp = { headers: { h: 'v' }, data: { ok: true }, status: 201 };
      vi.spyOn(axiosInstance, 'post').mockResolvedValue(mockResp);

      const options = { body: { a: 1 }, headers: { 'X-T': 't' } };
      const result = await networkClient.sendPostRequestAsync('http://post', options);
      expect(result).toEqual({ headers: mockResp.headers, body: mockResp.data, status: mockResp.status });
      expect(axiosInstance.post).toHaveBeenCalledWith(
        'http://post',
        options.body,
        expect.objectContaining({ headers: options.headers, responseType: 'json' }),
      );
    });

    it('should handle errors and return default shape', async () => {
      const err = { response: { headers: {}, data: { error: undefined }, status: 500 } };
      vi.spyOn(axiosInstance, 'post').mockRejectedValue(err);

      const result = await networkClient.sendPostRequestAsync('http://bad', {});
      expect(result).toEqual({ headers: err.response.headers, body: err.response.data, status: err.response.status });
    });
  });

  describe('refreshUserAccessToken', () => {
    beforeEach(() => {
      vi.spyOn(service, 'getClient').mockResolvedValue(mockConfidentialClientApplication);
    });

    it('should refresh the access token', async () => {
      const request = { session: { user: { id: 'test-user-id', token: 'test-token-before' } } };
      const userAccounts = [
        { username: 'test-user-id', idToken: 'test-token-before' },
        { username: 'test-other-user-id' },
      ];
      const tokenResponse = { idToken: 'test-token-after' };
      mockTokenCache.getAllAccounts.mockReturnValue(userAccounts);
      mockConfidentialClientApplication.acquireTokenSilent.mockResolvedValue(tokenResponse as AuthenticationResult);

      await service.refreshUserAccessToken(request as unknown as Request);

      expect(mockConfidentialClientApplication.getTokenCache).toHaveBeenCalled();
      expect(mockTokenCache.getAllAccounts).toHaveBeenCalled();
      expect(mockConfidentialClientApplication.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: oidcConfig.scopes,
        account: userAccounts[0],
        forceRefresh: true,
      });
      expect(request.session.user.token).toBe('test-token-after');
    });

    it('should return when the session does not have an token', async () => {
      const request = { session: { user: { id: 'test-user-id' } } };

      await service.refreshUserAccessToken(request as unknown as Request);

      expect(mockConfidentialClientApplication.getTokenCache).not.toHaveBeenCalled();
      expect(mockTokenCache.getAllAccounts).not.toHaveBeenCalled();
      expect(mockConfidentialClientApplication.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('should return when there is not an account for the user', async () => {
      const request = { session: { user: { id: 'test-user-id', token: 'test-token-before' } } };
      const userAccounts = [{ username: 'test-other-user-id' }];
      mockTokenCache.getAllAccounts.mockReturnValue(userAccounts);

      await service.refreshUserAccessToken(request as unknown as Request);

      expect(mockConfidentialClientApplication.getTokenCache).toHaveBeenCalled();
      expect(mockTokenCache.getAllAccounts).toHaveBeenCalled();
      expect(mockConfidentialClientApplication.acquireTokenSilent).not.toHaveBeenCalled();
      expect(request.session.user.token).toBe('test-token-before');
    });

    it('should update session user access token and return when the token has already been refreshed', async () => {
      const request = { session: { user: { id: 'test-user-id', token: 'test-token-before' } } };
      const userAccounts = [{ username: 'test-user-id', idToken: 'test-token-after' }];
      mockTokenCache.getAllAccounts.mockReturnValue(userAccounts);

      await service.refreshUserAccessToken(request as unknown as Request);

      expect(mockConfidentialClientApplication.getTokenCache).toHaveBeenCalled();
      expect(mockTokenCache.getAllAccounts).toHaveBeenCalled();
      expect(mockConfidentialClientApplication.acquireTokenSilent).not.toHaveBeenCalled();
      expect(request.session.user.token).toBe('test-token-after');
    });
  });
});
