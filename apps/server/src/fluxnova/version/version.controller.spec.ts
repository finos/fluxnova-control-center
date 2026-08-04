import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionController } from './version.controller';

describe('VersionController', () => {
  let controller: VersionController;

  const mockHttpService = {};
  const mockConfigService = { get: vi.fn() };
  const mockVersionApi = {
    getRestAPIVersion: vi.fn().mockResolvedValue({ data: { version: '1.2.3' } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as any as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<VersionController>(VersionController);
    (controller as any).versionApi = mockVersionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the REST API version', async () => {
    const result = await controller.getRestAPIVersion(mockRequest);
    expect(mockVersionApi.getRestAPIVersion).toHaveBeenCalledWith({});
    expect(result).toEqual({ version: '1.2.3' });
  });

  it('should handle errors from getRestAPIVersion', async () => {
    (controller as any).safeApiCall = vi.fn(async (fn: any, msg: string) => {
      try {
        return await fn();
      } catch {
        return msg;
      }
    });
    mockVersionApi.getRestAPIVersion.mockRejectedValueOnce(new Error('fail'));
    const result = await controller.getRestAPIVersion(mockRequest);
    expect(result).toBe('Error getting version');
  });
});
