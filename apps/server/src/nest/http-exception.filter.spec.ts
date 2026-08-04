import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FluxnovaError } from '../common';
import { HttpExceptionFilter } from './http-exception.filter';

const mockJson = vi.fn();
const mockStatus = vi.fn().mockImplementation(() => ({
  json: mockJson,
}));

const mockGetResponse = vi.fn().mockImplementation(() => ({
  status: mockStatus,
  // status: vi.fn(),
  // json: vi.fn(),
}));

const mockHttpArgumentsHost = vi.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: vi.fn().mockImplementation(() => ({
    apiParams: {},
  })),
}));

const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  switchToRpc: vi.fn(),
  switchToWs: vi.fn(),
  getArgByIndex: vi.fn(),
  getArgs: vi.fn(),
  getType: vi.fn(),
};

describe('HttpExceptionFilter', () => {
  let exceptionFilter: HttpExceptionFilter;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    exceptionFilter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(exceptionFilter).toBeDefined();
  });

  it('should add cause details to response', () => {
    const originalError: AxiosError = {
      type: 'HTTPError',
      message: 'Response code 500 (Internal Server Error)',
      stack: '',
      name: 'HTTPError',
      code: 'ERR_NON_2XX_3XX_RESPONSE',
      timings: {
        start: 1740602585933,
        socket: 1740602590081,
        lookup: 1740602590081,
        connect: 1740602590081,
        secureConnect: 1740602590165,
        upload: 1740602590166,
        response: 1740602591758,
        end: 1740602591759,
        phases: {
          wait: 4148,
          dns: 0,
          tcp: 0,
          tls: 84,
          request: 1,
          firstByte: 1592,
          download: 1,
          total: 5826,
        },
      },
      url: 'https://test',
      method: 'GET',
      response: {
        data: JSON.stringify({
          type: 'ProcessEngineException',
          message:
            'Calling latest() can only be used in combination with key(String) and keyLike(String) or name(String) and nameLike(String)',
          code: 0,
        }),
      },
      statusCode: 500,
    } as unknown as AxiosError;

    const error = new FluxnovaError('Some Fluxnova error', {
      cause: originalError,
    });

    exceptionFilter.catch(error, mockArgumentsHost);

    const expectedResponse = {
      message: error.message,
      statusCode: 500,
      cause: JSON.parse(originalError.response?.data as string),
    };

    expect(mockArgumentsHost.switchToHttp).toHaveBeenCalledWith();
    expect(mockArgumentsHost.switchToHttp().getResponse).toHaveBeenCalled();
    expect(mockArgumentsHost.switchToHttp().getResponse().status(500).json).toHaveBeenCalledWith(
      expect.objectContaining(expectedResponse),
    );
  });
});
