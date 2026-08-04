import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse, ResponseType } from 'axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  DEFAULT_ENGINE_HEADER_KEY,
  DEFAULT_IDENTITY_HEADER_KEY,
  EngineTenantRatio,
  TENANT_HEADER_KEY,
} from '@fxn/types';
import { FluxnovaError, scrubError } from '../common';
import { FluxnovaController } from './fluxnova-controller';
import { Configuration } from './generated';
import { BaseAPI } from './generated/base';
import type { Request } from 'express';

class TestFluxnovaController extends FluxnovaController {
  protected readonly logger = new Logger(TestFluxnovaController.name);
  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService, configService);
  }

  public override createApi<T extends BaseAPI>(
    ApiClass: new (config?: Configuration, basePath?: string, axios?: any) => T,
  ): T {
    return super.createApi(ApiClass);
  }

  public override async createAxiosOptions(req: Request, responseType = 'json') {
    return await super.createAxiosOptions(req, responseType as ResponseType);
  }

  public override handleApiError(error: any, defaultMessage: string) {
    return super.handleApiError(error, defaultMessage);
  }

  public override safeApiCall<TResult>(
    apiCall: () => Promise<TResult>,
    defaultMessage: string,
    ignore404: boolean = false,
  ): Promise<TResult> {
    return super.safeApiCall(apiCall, defaultMessage, ignore404);
  }
}

class MockAPI extends BaseAPI {
  constructor(configuration?: Configuration, basePath?: string, axios?: any) {
    super(configuration, basePath, axios);
  }
}

vi.mock('../common', async () => {
  const originalModule = await vi.importActual('../common');
  return {
    ...originalModule,
    generateUuidV4: vi.fn().mockReturnValue('mock-uuid-v4'),
    parseResponseBody: vi.fn().mockImplementation((response) => {
      try {
        return JSON.parse(response.data);
      } catch {
        return response.data;
      }
    }),
  };
});

describe('FluxnovaController', () => {
  let controller: TestFluxnovaController;
  let configService: ConfigService;
  let loggerSpy: Mock<{
    (message: any, stack?: string, context?: string): void;
    (message: any, ...optionalParams: [...any, string?, string?]): void;
  }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: vi.fn(),
              post: vi.fn(),
            },
          },
        },
        ConfigService,
        {
          provide: TestFluxnovaController,
          useFactory: (http: HttpService, config: ConfigService) => new TestFluxnovaController(http, config),
          inject: [HttpService, ConfigService],
        },
      ],
    }).compile();

    controller = module.get<TestFluxnovaController>(TestFluxnovaController);
    configService = module.get<ConfigService>(ConfigService);

    loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createApi', () => {
    it('should create an API instance with the configured URL', () => {
      const testUrl = 'https://test-api-url.com';
      vi.spyOn(configService, 'get').mockReturnValue(testUrl);

      const api = controller.createApi(MockAPI);

      expect(api).toBeInstanceOf(MockAPI);
      expect(configService.get).toHaveBeenCalledWith('FXN_REST_API_URL');
      expect((api as any).configuration.basePath).toBe(testUrl);
    });
  });

  describe('createAxiosOptions', () => {
    const mockRequest = {
      session: {
        user: {
          token: 'test-token',
          id: 'user-id',
        },
      },
      headers: {
        [TENANT_HEADER_KEY]: 'test-tenant',
      },
      state: {},
      get: vi.fn(),
    } as unknown as Request;

    it('should include the DEFAULT_IDENTITY_HEADER_KEY in the headers if FXN_IDENTITY_HEADER_KEY has not been configured', async () => {
      delete process.env.FXN_IDENTITY_HEADER_KEY;
      const options = await controller.createAxiosOptions(mockRequest);

      expect(options).toBeDefined();
      expect(options.responseType).toBe('json');
      expect(options.headers?.[DEFAULT_IDENTITY_HEADER_KEY]).toEqual('test-token');
    });

    it('should include a custom header when the FXN_IDENTITY_HEADER_KEY has been configured', async () => {
      process.env.FXN_IDENTITY_HEADER_KEY = 'i-am-a-custom-header';
      const options = await controller.createAxiosOptions(mockRequest);

      expect(options).toBeDefined();
      expect(options.headers?.['i-am-a-custom-header']).toEqual('test-token');
    });

    describe('when FXN_ENGINE_TENANT_RATIO is not configured', () => {
      it('there should be no engine header', async () => {
        delete process.env.FXN_ENGINE_HEADER_KEY;
        delete process.env.FXN_ENGINE_TENANT_RATIO;
        const options = await controller.createAxiosOptions(mockRequest);

        expect(options).toBeDefined();
        expect(options.headers?.[DEFAULT_ENGINE_HEADER_KEY]).not.toBeDefined();
      });
    });

    describe('when FXN_ENGINE_TENANT_RATIO is one-to-many', () => {
      it('there should be no engine header', async () => {
        delete process.env.FXN_ENGINE_HEADER_KEY;
        process.env.FXN_ENGINE_TENANT_RATIO = EngineTenantRatio.ONE_TO_MANY;

        const options = await controller.createAxiosOptions(mockRequest);

        expect(options).toBeDefined();
        expect(options.headers?.[DEFAULT_ENGINE_HEADER_KEY]).not.toBeDefined();
      });
    });

    describe('when FXN_ENGINE_TENANT_RATIO is one-to-one', () => {
      describe('when the FXN_ENGINE_HEADER_KEY is not configured', () => {
        it('the DEFAULT_ENGINE_HEADER_KEY should be present in the headers and the value should be set to the tenant in the request', async () => {
          delete process.env.FXN_ENGINE_HEADER_KEY;
          process.env.FXN_ENGINE_TENANT_RATIO = EngineTenantRatio.ONE_TO_ONE;

          const options = await controller.createAxiosOptions(mockRequest);

          expect(options).toBeDefined();
          expect(options.headers?.[DEFAULT_ENGINE_HEADER_KEY]).toBe('test-tenant');
        });
      });

      describe('when the FXN_ENGINE_HEADER_KEY is configured', () => {
        it('the FXN_ENGINE_HEADER_KEY should be present in the headers and the value should be set to the tenant in the request', async () => {
          process.env.FXN_ENGINE_TENANT_RATIO = EngineTenantRatio.ONE_TO_ONE;
          process.env.FXN_ENGINE_HEADER_KEY = 'i-am-the-engine-header';

          const options = await controller.createAxiosOptions(mockRequest);

          expect(options).toBeDefined();
          expect(options.headers?.['i-am-the-engine-header']).toEqual('test-tenant');
        });
      });
    });

    it('should use custom response type when provided', async () => {
      const options = await controller.createAxiosOptions(mockRequest, 'blob');

      expect(options.responseType).toBe('blob');
    });
  });

  describe('scrubError', () => {
    it('should be called when an API error is handled', () => {
      const mockError = {
        response: {
          data: null,
        },
      };
      const scrubbedError = scrubError(mockError);

      expect(() => {
        controller.handleApiError(mockError, 'Default error message');
      }).toThrow(FluxnovaError);

      expect(loggerSpy).toHaveBeenCalledWith(scrubbedError);
    });

    it('should scrub sensitive information from the Axios error objects', () => {
      const mockError = new AxiosError();
      mockError.code = 'ERR_TEST';
      mockError.message = 'Test error message';
      mockError.request = {} as any;
      mockError.request.method = 'GET';
      mockError.request.path =
        '/fluxnova-bpm/v2/process-instance/42424242-4242-4242-4242-424242424242/activity-instances';
      mockError.request.host = 'foo.example.com';
      mockError.request.headers = { foo: 'bar' };
      mockError.response = {} as AxiosResponse;
      mockError.response.status = 500;
      mockError.response.statusText = 'Internal Server Error';
      mockError.response.headers = { bar: 'baz' };
      mockError.response.data = null;
      const scrubbedError = scrubError(mockError);

      expect((scrubbedError as any).request?.headers).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    it('should throw a FluxnovaError with Fluxnova error message when available', () => {
      const error = new AxiosError();
      error.response = {
        data: JSON.stringify({ message: 'Fluxnova specific error message' }),
      } as AxiosResponse;

      expect(() => {
        controller.handleApiError(error, 'Default error message');
      }).toThrow(FluxnovaError);
      expect(() => {
        controller.handleApiError(error, 'Default error message');
      }).toThrow('Fluxnova specific error message');

      expect(loggerSpy).toHaveBeenCalledWith(scrubError(error));
    });

    it('should throw a FluxnovaError with default message when Fluxnova message is not available', () => {
      const error = {
        response: {
          data: null,
        },
      };

      expect(() => {
        controller.handleApiError(error, 'Default error message');
      }).toThrow(FluxnovaError);
      expect(() => {
        controller.handleApiError(error, 'Default error message');
      }).toThrow('Default error message');

      expect(loggerSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('safeApiCall', () => {
    it('should return the result of the API call when successful', async () => {
      const expectedResult = { data: 'test data' };
      const mockApiCall = vi.fn().mockResolvedValue(expectedResult);

      const result = await controller.safeApiCall(mockApiCall, 'Error message');

      expect(result).toEqual(expectedResult);
      expect(mockApiCall).toHaveBeenCalled();
    });

    it('should handle API errors by calling handleApiError', async () => {
      const mockError = new Error('API error');
      Object.defineProperty(mockError, 'response', {
        value: {
          status: 500,
          data: JSON.stringify({ message: 'Server error' }),
        },
      });

      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const handleApiErrorSpy = vi.spyOn(controller as any, 'handleApiError').mockImplementation(() => {
        throw new FluxnovaError('Server error', { cause: mockError });
      });

      await expect(controller.safeApiCall(mockApiCall, 'Default error')).rejects.toThrow('Server error');

      expect(mockApiCall).toHaveBeenCalled();
      expect(handleApiErrorSpy).toHaveBeenCalledWith(mockError, 'Default error');
    });

    it('should return an empty object for 404 errors when ignore404 is true', async () => {
      const mockError = new AxiosError('Not Found');
      mockError.response = {
        status: 404,
      } as AxiosResponse;

      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const result = await controller.safeApiCall(mockApiCall, 'Not found error', true);

      expect(result).toEqual({});
      expect(mockApiCall).toHaveBeenCalled();
    });

    it('should not ignore 404 errors when ignore404 is false', async () => {
      const mockError = new AxiosError('Not Found');
      mockError.response = {
        status: 404,
      } as AxiosResponse;

      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const handleApiErrorSpy = vi.spyOn(controller as any, 'handleApiError').mockImplementation(() => {
        throw new FluxnovaError('Not found error', { cause: mockError });
      });

      await expect(controller.safeApiCall(mockApiCall, 'Not found error', false)).rejects.toThrow('Not found error');

      expect(mockApiCall).toHaveBeenCalled();
      expect(handleApiErrorSpy).toHaveBeenCalledWith(mockError, 'Not found error');
    });
  });
});
