import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtelService } from './otel.service';
import type { Request, Response } from 'express';

vi.mock('http', () => ({ Agent: vi.fn() }));
vi.mock('https', () => ({ Agent: vi.fn() }));

describe('OtelService', () => {
  let module: TestingModule;
  let otelService: OtelService;

  const mockConfigService = {
    get: vi.fn(),
  };
  const mockHttpService = {
    axiosRef: {
      request: vi.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [OtelService],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    otelService = module.get<OtelService>(OtelService);
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  });

  describe('proxyToLocalOtelAgent', () => {
    const mockRequest = {
      url: 'http://test-url.domain:1234/v1/traces',
      headers: { foo: 'bar' },
      query: { baz: 'qux' },
      body: 'test-body',
    };
    const mockResponse = { status: vi.fn(), setHeader: vi.fn(), send: vi.fn() };
    mockResponse.status.mockImplementation(() => mockResponse);
    const mockAxiosResponse = {
      status: 'test-status',
      headers: { testKey: 'test-value' },
      data: {
        pipe: vi.fn(),
      },
    };

    beforeEach(() => {
      mockConfigService.get.mockReturnValueOnce('http://test-otel-url.domain:5678');
      vi.clearAllMocks();
    });

    it('should proxy the request to the OTEL endpoint', async () => {
      mockHttpService.axiosRef.request.mockResolvedValue(mockAxiosResponse);

      await otelService.proxyToLocalOtelAgent(mockRequest as unknown as Request, mockResponse as unknown as Response);

      expect(mockConfigService.get).toHaveBeenCalledWith('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
      expect(mockHttpService.axiosRef.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'http://test-otel-url.domain:5678/v1/traces',
          headers: { foo: 'bar', host: 'test-otel-url.domain' },
          params: mockRequest.query,
          data: mockRequest.body,
          responseType: 'stream',
          proxy: false,
          httpAgent: expect.any(Object),
          httpsAgent: expect.any(Object),
        }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(mockAxiosResponse.status);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('testKey', 'test-value');
      expect(mockAxiosResponse.data.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 500 response on error', async () => {
      mockHttpService.axiosRef.request.mockRejectedValue(new Error());

      await otelService.proxyToLocalOtelAgent(mockRequest as unknown as Request, mockResponse as unknown as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Error proxying request for OTEL');
    });
  });
});
