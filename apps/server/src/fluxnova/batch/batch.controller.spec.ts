import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchParams } from '@fxn/types';
import { BatchController } from './batch.controller';

describe('BatchController', () => {
  let controller: BatchController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockBatchApi = {
    getBatchStatistics: vi.fn().mockResolvedValue({ data: [] }),
    getBatchStatisticsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    deleteBatch: vi.fn().mockResolvedValue({ data: null }),
    updateBatchSuspensionState: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockHistoricBatchApi = {
    getHistoricBatches: vi.fn().mockResolvedValue({ data: [] }),
    getHistoricBatchesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getHistoricBatch: vi.fn().mockResolvedValue({ data: {} }),
    deleteHistoricBatch: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<BatchController>(BatchController);

    (controller as any).batchApi = mockBatchApi;
    (controller as any).historicBatchApi = mockHistoricBatchApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the getBatchStatistics method on BatchApi', async () => {
    const batchId = 'abc-123-456';
    await controller.getBatchStatistics(mockRequest, batchId);

    expect(mockBatchApi.getBatchStatistics).toHaveBeenCalledWith({ batchId }, {});
  });

  it('should delegate to the getHistoricBatches method on HistoricBatchApi', async () => {
    const params = { batchId: '1234' } as BatchParams;
    await controller.getBatchHistory(mockRequest, params);

    expect(mockHistoricBatchApi.getHistoricBatches).toHaveBeenCalledWith({ ...params, completed: true }, {});
  });

  it('should delegate to the getHistoricBatch method on HistoricBatchApi', async () => {
    const id = 'abc-123-456';
    await controller.getBatch(mockRequest, id);

    expect(mockHistoricBatchApi.getHistoricBatch).toHaveBeenCalledWith({ id }, {});
  });

  it('should delegate to the getBatchStatistics method on BatchApi for getBatches', async () => {
    const params = { completed: 'true' } as any;
    await controller.getBatches(mockRequest, params);

    expect(mockBatchApi.getBatchStatistics).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getBatchStatisticsCount method on BatchApi', async () => {
    const params = { completed: 'true' } as any;
    await controller.getBatchCount(mockRequest, params);

    expect(mockBatchApi.getBatchStatisticsCount).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the deleteBatch method on BatchApi', async () => {
    const id = 'abc-123-456';
    const cascade = true;
    await controller.deleteBatch(mockRequest, id, cascade);

    expect(mockBatchApi.deleteBatch).toHaveBeenCalledWith({ id, cascade }, {});
  });

  it('should delegate to the deleteHistoricBatch method on HistoricBatchApi', async () => {
    const id = 'abc-123-456';
    await controller.deleteHistoricBatch(mockRequest, id);

    expect(mockHistoricBatchApi.deleteHistoricBatch).toHaveBeenCalledWith({ id }, {});
  });

  it('should delegate to the updateBatchSuspensionState method on BatchApi', async () => {
    const id = 'abc-123-456';
    const body = { suspended: true };
    await controller.suspend(mockRequest, id, body);

    expect(mockBatchApi.updateBatchSuspensionState).toHaveBeenCalledWith({ id, suspensionStateDto: body }, {});
  });

  it('should delegate to the getHistoricBatchesCount method on HistoricBatchApi', async () => {
    const params = { batchId: '1234' } as any;
    await controller.getBatchHistoryCount(mockRequest, params);

    expect(mockHistoricBatchApi.getHistoricBatchesCount).toHaveBeenCalledWith({ ...params, completed: true }, {});
  });
});
