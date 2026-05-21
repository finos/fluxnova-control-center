import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UserTaskController } from './user-task.controller.ts';
import type { Request } from 'express';

describe('UserTaskController', () => {
  let controller: UserTaskController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockTaskApi = {
    getTasks: vi.fn().mockResolvedValue({ data: [{ id: 'task1' }] }),
    getTasksCount: vi.fn().mockResolvedValue({ data: { count: 7 } }),
  };
  const mockRequest = { user: { id: 'test-user' }, headers: {} } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTaskController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<UserTaskController>(UserTaskController);
    (controller as any).taskApi = mockTaskApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to getTasks on TaskApi with transformed params and return data', async () => {
    const filtersAndPagination = {
      filter: { foo: 'bar' },
      maxResults: 10,
      firstResult: 0,
    };
    const result = await controller.getUserTaskWithFilter(mockRequest, filtersAndPagination);
    expect(mockTaskApi.getTasks).toHaveBeenCalledWith({ foo: 'bar', maxResults: 10, firstResult: 0 }, {});
    expect(result).toEqual([{ id: 'task1' }]);
  });

  it('should delegate to getTasksCount on TaskApi with transformed params and return count', async () => {
    const filters = { foo: 'bar' };
    const result = await controller.getUserTaskCountWithFilter(mockRequest, filters);
    expect(mockTaskApi.getTasksCount).toHaveBeenCalledWith({ foo: 'bar' }, {});
    expect(result).toBe(7);
  });

  it('should return 0 if count is missing in response', async () => {
    mockTaskApi.getTasksCount.mockResolvedValueOnce({ data: {} });
    const result = await controller.getUserTaskCountWithFilter(mockRequest, { foo: 'bar' });
    expect(result).toBe(0);
  });
});
