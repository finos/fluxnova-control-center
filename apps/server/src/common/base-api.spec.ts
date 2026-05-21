import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DEFAULT_ENGINE_HEADER_KEY, DEFAULT_IDENTITY_HEADER_KEY, HealthCheck, TENANT_HEADER_KEY } from '@fxn/types';
import { ConfigService } from '@nestjs/config';
import * as common from '../common';
import { BaseApi } from './base-api';
import type { Request } from 'express';

vi.mock('../common', () => ({
  generateUuidV4: vi.fn(),
  getOAuthToken: vi.fn(),
  getSecret: vi.fn(),
}));

const mockHttpService: Mocked<HttpService> = {
  axiosRef: {
    interceptors: {
      request: {
        use: vi.fn((fn) => {
          // Save the interceptor for test access
          (mockHttpService.axiosRef as any)._interceptorFn = fn;
          return 0;
        }),
        eject: vi.fn(),
        clear: vi.fn(),
      },
    },
  },
  get: vi.fn(),
} as unknown as Mocked<HttpService>;

const mockConfigService = {
  get: (key: string): string => {
    if (key === 'FXN_IDENTITY_HEADER_KEY') return DEFAULT_IDENTITY_HEADER_KEY;
    if (key === 'FXN_ENGINE_HEADER_KEY') return DEFAULT_ENGINE_HEADER_KEY;

    return '';
  },
};

describe('BaseApi', () => {
  let baseApi: BaseApi;

  beforeEach(() => {
    vi.mocked(common.generateUuidV4).mockReturnValue('uuid123');

    baseApi = new BaseApi(mockHttpService as unknown as HttpService, mockConfigService as unknown as ConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize httpService and set headers', async () => {
    const params: Request & { [key: string]: any } = {
      session: {
        user: {
          token: 'token',
          id: 'u123',
        },
      },
      headers: {
        [TENANT_HEADER_KEY]: 'tenant1',
      },
      env: 'test',
    } as unknown as Request;

    await baseApi.initializeHttpService(params);

    const expectedHeaders = {
      [DEFAULT_IDENTITY_HEADER_KEY]: 'token',
      [DEFAULT_ENGINE_HEADER_KEY]: 'tenant1',
    };
    // Headers set
    expect(baseApi['headers']).toEqual(expectedHeaders);
  });

  it('should handle health check (healthy)', async () => {
    const mockHealth: HealthCheck = {
      status: 'pass',
      meta: { name: 'service', message: 'ok' },
    } as unknown as HealthCheck;
    vi.mocked(mockHttpService.get).mockReturnValueOnce(of({ status: 200, data: mockHealth } as AxiosResponse));

    const result = await baseApi['getStandardApiHealth']();
    expect(result).toEqual({
      status: 'pass',
      statusCode: 200,
      scope: 'external',
      message: 'ok',
    });
  });

  it('should handle health check with unrecognized format', async () => {
    vi.mocked(mockHttpService.get).mockReturnValueOnce(of({ status: 200, data: {} } as AxiosResponse));
    (mockHttpService.axiosRef?.interceptors.request as any).use = vi.fn((fn: any) => {
      // Simulate interceptor for health
      const config = { headers: { 'random-header': 'to-be-removed' } };
      fn(config);
      expect(config.headers['random-header']).toBeUndefined();
      return 123;
    });
    (mockHttpService.axiosRef?.interceptors.request as any).eject = vi.fn();

    const result = await baseApi['getStandardApiHealth']();
    expect(result).toEqual({
      status: 'fail',
      statusCode: 200,
      scope: 'external',
      message: 'The response received was not in a recognized format: {}',
    });
  });

  it('should handle health check with network error', async () => {
    vi.mocked(mockHttpService.get).mockReturnValueOnce(throwError(() => new Error('Network Error')));
    (mockHttpService.axiosRef?.interceptors.request as any).use = vi.fn(() => 123);
    (mockHttpService.axiosRef?.interceptors.request as any).eject = vi.fn();

    const result = await baseApi['getStandardApiHealth']();
    expect(result).toEqual({
      status: 'fail',
      name: undefined,
      scope: 'external',
      message: 'There was a network error retrieving the health status for this service: Error: Network Error',
    });
  });

  it('getHealth returns array with standard health check promise', () => {
    const arr = baseApi.getHealth();
    expect(Array.isArray(arr)).toBe(true);
    expect(typeof arr[0].then).toBe('function');
  });
});
