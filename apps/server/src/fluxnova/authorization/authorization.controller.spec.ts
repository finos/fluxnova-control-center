import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationController } from './authorization.controller';
import type { Request } from 'express';

const mockHttpService = { axiosRef: {} };
const mockConfigService = { get: vi.fn() };
const mockApi = { isUserAuthorized: vi.fn() };
const mockRequest = {
  session: { user: { token: 'token' } },
  headers: {},
} as unknown as Request;

describe('AuthorizationController', () => {
  let controller: AuthorizationController;

  beforeEach(async () => {
    class TestAuthorizationController extends AuthorizationController {
      createApi = vi.fn().mockReturnValue(mockApi);
      createAxiosOptions = vi.fn().mockResolvedValue({ headers: {} });
    }
    controller = new TestAuthorizationController(mockHttpService as any, mockConfigService as any) as any;
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorizationController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthorizationController>(AuthorizationController);
    (controller as any).api = mockApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('should call isUserAuthorized and return data', async () => {
    it('with resourceId', async () => {
      const params = {
        permissionName: 'READ',
        resourceName: 'resource',
        resourceType: 1,
        resourceId: 'abc12345',
      };
      const expectedData = { authorized: true };
      mockApi.isUserAuthorized.mockResolvedValue({ data: expectedData });

      const result = await controller.check(
        mockRequest,
        params.permissionName,
        params.resourceName,
        params.resourceType,
        params.resourceId,
      );
      expect(mockApi.isUserAuthorized).toHaveBeenCalledWith(params, expect.any(Object));
      expect(result).toEqual(expectedData);
    });

    it('without resourceId', async () => {
      const params = {
        permissionName: 'READ',
        resourceName: 'resource',
        resourceType: 1,
      };
      const expectedData = { authorized: true };
      mockApi.isUserAuthorized.mockResolvedValue({ data: expectedData });

      const result = await controller.check(
        mockRequest,
        params.permissionName,
        params.resourceName,
        params.resourceType,
      );
      expect(mockApi.isUserAuthorized).toHaveBeenCalledWith(params, expect.any(Object));
      expect(result).toEqual(expectedData);
    });
  });

  it('should handle errors from isUserAuthorized', async () => {
    mockApi.isUserAuthorized.mockRejectedValue(new Error('fail'));
    (controller as any).safeApiCall = vi.fn(async (fn) => {
      try {
        return await fn();
      } catch (e: any) {
        throw new Error('wrapped: ' + e.message);
      }
    });
    expect(controller.check(mockRequest, 'READ', 'res', 1, 'abc12345')).rejects.toThrow('wrapped: fail');
  });
});
