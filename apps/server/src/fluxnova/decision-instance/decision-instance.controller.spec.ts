import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionInstanceController } from './decision-instance.controller';

describe('DecisionInstanceController', () => {
  let controller: DecisionInstanceController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockHistoricDecisionInstanceApi = {
    getHistoricDecisionInstances: vi.fn().mockResolvedValue({ data: [] }),
    getHistoricDecisionInstancesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getHistoricDecisionInstance: vi.fn().mockResolvedValue({ data: {} }),
  };

  const mockDecisionDefinitionApi = {
    getDecisionDefinitionDmnXmlById: vi.fn().mockResolvedValue({ data: '<dmn></dmn>' }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecisionInstanceController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<DecisionInstanceController>(DecisionInstanceController);

    (controller as any).decisionInstanceApi = mockHistoricDecisionInstanceApi;
    (controller as any).decisionDefinitionApi = mockDecisionDefinitionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the getHistoricDecisionInstances method on HistoricDecisionInstanceApi', async () => {
    const params = { decisionDefinitionId: 'test-id' };
    await controller.getList(mockRequest, params);

    expect(mockHistoricDecisionInstanceApi.getHistoricDecisionInstances).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getHistoricDecisionInstancesCount method on HistoricDecisionInstanceApi', async () => {
    const params = { decisionDefinitionId: 'test-id' };
    await controller.getListCount(mockRequest, params);

    expect(mockHistoricDecisionInstanceApi.getHistoricDecisionInstancesCount).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getDecisionDefinitionDmnXmlById method on DecisionDefinitionApi', async () => {
    await controller.getDiagram(mockRequest, 'test-id');

    expect(mockDecisionDefinitionApi.getDecisionDefinitionDmnXmlById).toHaveBeenCalledWith({ id: 'test-id' }, {});
  });

  it('should delegate to the getHistoricDecisionInstance method on HistoricDecisionInstanceApi', async () => {
    await controller.getInstance(mockRequest, 'test-id', false, false);

    expect(mockHistoricDecisionInstanceApi.getHistoricDecisionInstance).toHaveBeenCalledWith(
      { id: 'test-id', includeInputs: false, includeOutputs: false },
      {},
    );
  });

  it('should return 0 when count is null or undefined', async () => {
    const params = { processDefinitionId: '123' };
    mockHistoricDecisionInstanceApi.getHistoricDecisionInstancesCount.mockResolvedValue({ data: { count: null } });

    const result = await controller.getListCount(mockRequest, params);

    expect(mockHistoricDecisionInstanceApi.getHistoricDecisionInstancesCount).toHaveBeenCalledWith(params, {});
    expect(result).toEqual(0);
  });

  it('should return 0 when count data is undefined', async () => {
    const params = { processDefinitionId: '123' };
    mockHistoricDecisionInstanceApi.getHistoricDecisionInstancesCount.mockResolvedValue({ data: undefined });

    const result = await controller.getListCount(mockRequest, params);

    expect(mockHistoricDecisionInstanceApi.getHistoricDecisionInstancesCount).toHaveBeenCalledWith(params, {});
    expect(result).toEqual(0);
  });
});
