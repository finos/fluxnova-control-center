/* eslint-disable n/no-process-env -- Direct process.env access is being used to manipulate the configuration & is acceptable in the context of these tests. */

import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import jsonWebToken from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NodeCache from 'node-cache';
import { FluxnovaError } from '../common/app-error';
import { getCache } from '../common/cache';
import { GetTokenParams, OauthService, OauthTokenResponse } from './oauth.service';

vi.mock('jsonwebtoken');
vi.mock('axios');
vi.mock('../common/cache');
vi.mock('http-proxy-agent');
vi.mock('https-proxy-agent');

const mockLogger = {
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
} as unknown as Logger;

describe('OauthService', () => {
  let service: OauthService;
  let mockConfigService: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.http_proxy;
    delete process.env.HTTP_PROXY;

    // Properly mock ConfigService
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'http_proxy' || key === 'HTTP_PROXY') {
          return process.env[key];
        }
        return undefined;
      }),
    };

    service = new OauthService(mockConfigService);
  });

  describe('isTokenNearlyExpired', () => {
    it('returns true if token is undefined or null', () => {
      expect(service.isTokenNearlyExpired(undefined)).toBe(true);
      expect(service.isTokenNearlyExpired(null as any)).toBe(true);
    });

    it('returns true if token has no exp', () => {
      vi.mocked(jsonWebToken.decode).mockReturnValue({
        payload: {},
      });
      expect(service.isTokenNearlyExpired('sometoken')).toBe(true);
    });

    it('returns false if token is not expired', () => {
      const future = Math.floor(Date.now() / 1000) + 400;
      vi.mocked(jsonWebToken.decode).mockReturnValue({
        payload: { exp: future },
      });
      expect(service.isTokenNearlyExpired('validtoken', 300)).toBe(false);
    });

    it('returns true if token is about to expire (exp < now + allowed)', () => {
      const soon = Math.floor(Date.now() / 1000) + 100;
      vi.mocked(jsonWebToken.decode).mockReturnValue({
        payload: { exp: soon },
      });
      expect(service.isTokenNearlyExpired('almostexpired', 300)).toBe(true);
    });
  });

  describe('getOAuthToken', () => {
    const cacheMock = {
      get: vi.fn(),
      set: vi.fn(),
    };
    const getParams: () => Promise<GetTokenParams> = async () => ({
      tokenUri: 'https://example.com/token',
      clientId: 'clientid',
      clientSecret: 'clientsecret',
      scope: 'myscope',
      contentType: 'json',
    });

    beforeEach(() => {
      vi.mocked(getCache).mockReturnValue(cacheMock as unknown as NodeCache);
      cacheMock.get.mockReset();
      cacheMock.set.mockReset();
    });

    it('returns cached token if not nearly expired', async () => {
      const validToken = 'valid.token';
      vi.mocked(cacheMock.get).mockResolvedValue(validToken);
      vi.spyOn(service, 'isTokenNearlyExpired').mockReturnValue(false);
      const token = await service.getOAuthToken(getParams, mockLogger, 'prefix-');
      expect(token).toBe(validToken);
      expect(cacheMock.get).toHaveBeenCalled();
      expect(cacheMock.set).not.toHaveBeenCalled();
    });

    it('refreshes and caches token if nearly expired', async () => {
      const expiredToken = 'expired.token';
      const refreshedResponse: OauthTokenResponse = {
        access_token: 'fresh.token',
        token_type: 'bearer',
        expires_in: 1234,
      };
      vi.mocked(cacheMock.get).mockResolvedValue(expiredToken);
      vi.spyOn(service, 'isTokenNearlyExpired').mockReturnValue(true);
      vi.spyOn(service, 'refreshToken').mockResolvedValue(refreshedResponse);

      const mockPost = vi.fn().mockResolvedValue({
        data: { access_token: 'fresh.token', token_type: 'bearer', expires_in: 3600 },
      });
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
      } as unknown as AxiosInstance);

      const token = await service.getOAuthToken(getParams, mockLogger, 'prefix-');
      expect(token).toBe('fresh.token');
      expect(cacheMock.set).toHaveBeenCalledWith('prefix-clientid', 'fresh.token');
    });

    it('logs error and returns expired token if refresh fails', async () => {
      cacheMock.get.mockResolvedValue('expired.token');
      vi.spyOn(service, 'isTokenNearlyExpired').mockReturnValue(true);
      vi.spyOn(service, 'refreshToken').mockRejectedValue(new Error('fail-refresh'));

      const mockPost = vi.fn().mockRejectedValue(new Error('axios fails'));
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
      } as unknown as AxiosInstance);

      const token = await service.getOAuthToken(getParams, mockLogger, 'prefix-');
      expect(token).toBe('expired.token');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const params: GetTokenParams = {
      tokenUri: 'https://example.com/token',
      clientId: 'cid',
      clientSecret: 'secret',
      scope: 'myscope',
      contentType: 'json',
    };

    it('makes a json request and returns token', async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { access_token: 'tok', token_type: 'bearer', expires_in: 333 } }),
      } as unknown as AxiosInstance);

      const result = await service.refreshToken(params);
      expect(axios.create).toHaveBeenCalled();
      expect(result).toEqual({ access_token: 'tok', token_type: 'bearer', expires_in: 333 });
    });

    it('makes a form request if contentType is "form"', async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { access_token: 'tok2', token_type: 'bearer', expires_in: 444 } }),
      } as unknown as AxiosInstance);
      const formParams = { ...params, contentType: 'form' as const };
      const result = await service.refreshToken(formParams);
      expect(result).toEqual({ access_token: 'tok2', token_type: 'bearer', expires_in: 444 });
    });

    it('uses proxy config if http_proxy is set', async () => {
      process.env.http_proxy = 'http://proxy:8080';
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { access_token: 'tok3', token_type: 'bearer', expires_in: 555 } }),
      } as unknown as AxiosInstance);

      const result = await service.refreshToken(params);
      expect(HttpProxyAgent).toHaveBeenCalledWith('http://proxy:8080');
      expect(HttpsProxyAgent).toHaveBeenCalledWith('http://proxy:8080');
      expect(result.access_token).toBe('tok3');
    });

    it('throws FluxnovaError if axios fails', async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockRejectedValue(new Error('axios fails')),
      } as unknown as AxiosInstance);
      await expect(service.refreshToken(params)).rejects.toThrow(FluxnovaError);
    });
  });
});
