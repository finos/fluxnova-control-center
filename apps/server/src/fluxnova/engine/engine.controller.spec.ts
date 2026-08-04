import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EngineController } from './engine.controller';
import type { Request } from 'express';

let controller: EngineController;

const mockHttpService = {};

const mockConfigService = {
  get: vi.fn(),
};

const mockEngineApi = {
  getProcessEngineNames: vi.fn().mockResolvedValue({ data: [] }),
};

const mockRequest = {
  user: { id: 'test-user' },
  headers: {},
} as unknown as Request;

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [EngineController],
    providers: [
      { provide: HttpService, useValue: mockHttpService },
      { provide: ConfigService, useValue: mockConfigService },
    ],
  }).compile();

  controller = module.get<EngineController>(EngineController);

  (controller as any).api = mockEngineApi;
  vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Engine Controller', () => {
  it('returns engine names on successful API call', async () => {
    const mockResponse = { data: [{ name: 'engine1' }, { name: 'engine2' }] };
    vi.spyOn(mockEngineApi, 'getProcessEngineNames').mockResolvedValue(mockResponse);

    const result = await controller.engines(mockRequest);

    expect(result).toEqual(mockResponse.data);
  });

  it('throws error message on API failure', async () => {
    vi.spyOn(mockEngineApi, 'getProcessEngineNames').mockRejectedValue(new Error('API error'));

    await expect(controller.engines(mockRequest)).rejects.toThrow('Error getting engines');
  });

  it('includes access parameter in API call', async () => {
    const mockResponse = { data: ['engine1'] };
    vi.spyOn(mockEngineApi, 'getProcessEngineNames').mockResolvedValue(mockResponse);

    await controller.engines(mockRequest);

    expect(mockEngineApi.getProcessEngineNames).toHaveBeenCalledWith(
      expect.objectContaining({ url: '?access=application' }),
    );
  });
});
