import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { StaticAssetsService } from './static-assets.service';
import type { Response } from 'express';

const mockCheck = vi.fn();

vi.mock('tcp-port-used', () => ({
  check: () => mockCheck(),
}));

const mockResponse = {
  sendFile: vi.fn(),
  setHeader: vi.fn(),
  contentType: vi.fn(() => mockResponse),
  status: vi.fn(() => mockResponse),
  send: vi.fn(),
  end: vi.fn(),
  headersSent: false,
} as unknown as Mocked<Response>;

const mockReq = {
  url: '/asdf',
  query: {
    withIncidents: true,
  },
  pipe: vi.fn(() => mockReq),
  on: vi.fn(() => mockReq),
  method: 'GET',
  headers: {},
} as unknown as Mocked<Request>;

let service: StaticAssetsService;
let mockHttpService: Mocked<HttpService>;
let mockAxiosRef: any;

beforeEach(() => {
  mockAxiosRef = {
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  mockHttpService = {
    axiosRef: mockAxiosRef,
  } as unknown as Mocked<HttpService>;

  service = new StaticAssetsService(mockHttpService);

  vi.clearAllMocks();
});

describe('The static-assets service, when proxying to the local angular dev server', () => {
  it('should send a 500 response if the local app is not running', async () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:4200');
    (error as any).code = 'ECONNREFUSED';
    mockAxiosRef.request.mockRejectedValueOnce(error);
    mockCheck.mockReturnValueOnce(false);

    await service.proxyToLocalAngularDevServer(mockReq, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith(
      `To view the frontend locally, you must be running "nx serve frontend"`,
    );
  });

  it('should stream the request and respond', async () => {
    const stream = { pipe: vi.fn() };
    const proxiedResponse = {
      data: stream,
      status: 200,
      headers: {
        'content-type': 'text/html',
        'x-custom': 'value',
      },
      request: {},
    };
    mockAxiosRef.request.mockResolvedValueOnce(proxiedResponse);

    await service.proxyToLocalAngularDevServer(mockReq, mockResponse);

    expect(mockAxiosRef.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: mockReq.method,
        url: 'http://localhost:4200/asdf',
        headers: {
          ...mockReq.headers,
          host: 'localhost',
        },
        params: mockReq.query,
        responseType: 'stream',
        httpAgent: expect.any(Object),
      }),
    );

    expect(mockResponse.status).toHaveBeenCalledWith(proxiedResponse.status);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('content-type', 'text/html');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('x-custom', 'value');
    expect(stream.pipe).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle error and send 500 if can't proxy the request", async () => {
    mockAxiosRef.request.mockRejectedValueOnce(new Error('fail'));

    await service.proxyToLocalAngularDevServer(mockReq, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith(`error proxying request`);
  });

  it('should handle 304 error', async () => {
    mockAxiosRef.request.mockRejectedValueOnce({
      response: { status: 304 },
    });

    await service.proxyToLocalAngularDevServer(mockReq, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(304);
    expect(mockResponse.end).toHaveBeenCalled();
  });

  it('should abort if headers already sent on error', async () => {
    mockResponse.headersSent = true;
    mockAxiosRef.request.mockRejectedValueOnce(new Error('fail'));

    await service.proxyToLocalAngularDevServer(mockReq, mockResponse);

    expect(mockResponse.status).not.toHaveBeenCalledWith(500);
    expect(mockResponse.send).not.toHaveBeenCalled();
    mockResponse.headersSent = false; // cleanup
  });
});
