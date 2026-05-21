import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ExternalTaskController } from './external-task.controller';
import type { Request } from 'express';

describe('ExternalTaskController', () => {
  let controller: ExternalTaskController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockExternalTaskApi = {
    getExternalTaskErrorDetails: vi.fn().mockResolvedValue({
      data: 'Error: Task execution failed\n  at TaskHandler.execute (task-handler.ts:42)\n  at async Worker.run (worker.ts:123)',
    }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: { authorization: 'Bearer token' },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalTaskController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<ExternalTaskController>(ExternalTaskController);
    (controller as any).externalTaskApi = mockExternalTaskApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockResolvedValue({
      headers: { authorization: 'Bearer token' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have externalTaskApi initialized', () => {
    expect((controller as any).externalTaskApi).toBeDefined();
  });

  describe('getExternalTaskErrorDetails', () => {
    it('should fetch error details for a valid task id', async () => {
      const taskId = 'task-123';
      const expectedErrorDetails =
        'Error: Task execution failed\n  at TaskHandler.execute (task-handler.ts:42)\n  at async Worker.run (worker.ts:123)';

      mockExternalTaskApi.getExternalTaskErrorDetails.mockResolvedValueOnce({
        data: expectedErrorDetails,
      });

      const result = await controller.getExternalTaskErrorDetails(mockRequest, taskId);

      expect(mockExternalTaskApi.getExternalTaskErrorDetails).toHaveBeenCalledWith(
        { id: taskId },
        { headers: { authorization: 'Bearer token' } },
      );
      expect(result).toBe(expectedErrorDetails);
    });
  });
});
