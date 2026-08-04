import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityInstanceHistory, ProcessInstanceTerminateRequest } from '@fxn/types';
import { allHistoryTypes, ProcessInstanceController } from './process-instance.controller';

const processInstanceId = 'asdf';
const processInstanceIds = ['asdf', 'zxcsdf'];

describe('ProcessInstanceController', () => {
  let controller: ProcessInstanceController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockProcessInstanceApi = {
    queryProcessInstancesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    modifyProcessInstance: vi.fn().mockResolvedValue({ data: {} }),
    updateSuspensionStateById: vi.fn().mockResolvedValue({ data: null }),
    deleteProcessInstance: vi.fn().mockResolvedValue({ data: null }),
    updateSuspensionStateAsyncOperation: vi.fn().mockResolvedValue({ data: {} }),
    deleteProcessInstancesAsyncOperation: vi.fn().mockResolvedValue({ data: {} }),
    getActivityInstanceTree: vi.fn().mockResolvedValue({ data: {} }),
    getProcessInstances: vi.fn().mockResolvedValue({ data: {} }),
  };

  const mockHistoricProcessInstanceApi = {
    queryHistoricProcessInstances: vi.fn().mockImplementation((params) => {
      if (params.historicProcessInstanceQueryDto?.processInstanceIds?.length) {
        return Promise.resolve({
          data: params.historicProcessInstanceQueryDto.processInstanceIds.map((id: string) => ({ id })),
        });
      } else {
        return Promise.resolve({
          data: [{ id: processInstanceId }],
        });
      }
    }),
    queryHistoricProcessInstancesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
  };

  const mockHistoricIncidentApi = {
    getHistoricIncidents: vi.fn().mockImplementation((params) =>
      Promise.resolve({
        data: [{ processInstanceId: params.processInstanceId ?? processInstanceId }],
      }),
    ),
  };

  const mockHistoricUserOperationLogApi = {
    queryUserOperationEntries: vi.fn().mockResolvedValue({ data: [] }),
  };

  const mockHistoricDetailApi = {
    getHistoricDetails: vi.fn().mockResolvedValue({ data: [] }),
  };

  const mockHistoricActivityInstanceApi = {
    getHistoricActivityInstances: vi.fn().mockResolvedValue({ data: [] }),
    getHistoricActivityInstancesCount: vi.fn().mockResolvedValue({ data: { count: 100 } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessInstanceController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<ProcessInstanceController>(ProcessInstanceController);

    (controller as any).processInstanceApi = mockProcessInstanceApi;
    (controller as any).historicProcessInstanceApi = mockHistoricProcessInstanceApi;
    (controller as any).historicIncidentApi = mockHistoricIncidentApi;
    (controller as any).historicUserOperationLogApi = mockHistoricUserOperationLogApi;
    (controller as any).historicDetailApi = mockHistoricDetailApi;
    (controller as any).historicActivityInstanceApi = mockHistoricActivityInstanceApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('retrieves process instance with filter body with no incident data', async () => {
    const filterBody = {
      filter: {
        mockFilter: 'true',
      },
      firstResult: 0,
      maxResults: 50,
    };
    const result = await controller.getProcessInstanceWithFilterBody(mockRequest, filterBody, undefined);

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstances).toHaveBeenCalledWith(
      {
        firstResult: filterBody.firstResult,
        maxResults: filterBody.maxResults,
        historicProcessInstanceQueryDto: filterBody.filter,
      },
      {},
    );
    expect(mockHistoricIncidentApi.getHistoricIncidents).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: processInstanceId,
        hasIncidents: false,
      },
    ]);
  });

  it('retrieves process instance incident data when processDefinitionId is provided', async () => {
    const filterBody = {
      filter: {
        mockFilter: 'true',
        processDefinitionId: 'defId',
      },
      firstResult: 0,
      maxResults: 50,
    };
    const result = await controller.getProcessInstanceWithFilterBody(mockRequest, filterBody, 'true');

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstances).toHaveBeenCalledWith(
      {
        firstResult: filterBody.firstResult,
        maxResults: filterBody.maxResults,
        historicProcessInstanceQueryDto: filterBody.filter,
      },
      {},
    );
    expect(mockHistoricIncidentApi.getHistoricIncidents).toHaveBeenCalledWith(
      {
        processDefinitionId: filterBody.filter.processDefinitionId,
        open: true,
      },
      {},
    );
    expect(result).toEqual([
      {
        id: processInstanceId,
        hasIncidents: true,
      },
    ]);
  });

  it('retrieves process instance incident data when superProcessInstanceId is provided', async () => {
    const filterBody = {
      filter: {
        processInstanceIds,
        superProcessInstanceId: 'superId',
        sorting: [{ sortBy: 'instanceId', sortOrder: 'asc' }],
      },
      firstResult: 0,
      maxResults: 50,
    };
    mockProcessInstanceApi.getProcessInstances.mockResolvedValue({
      data: [{ id: filterBody.filter.processInstanceIds[0] }, { id: filterBody.filter.processInstanceIds[1] }],
    });

    const result = await controller.getProcessInstanceWithFilterBody(mockRequest, filterBody, 'true');

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstances).toHaveBeenCalledWith(
      {
        firstResult: filterBody.firstResult,
        maxResults: filterBody.maxResults,
        historicProcessInstanceQueryDto: filterBody.filter,
      },
      {},
    );
    expect(mockProcessInstanceApi.getProcessInstances).toHaveBeenCalledWith(
      {
        superProcessInstance: 'superId',
        withIncident: true,
      },
      {},
    );
    expect(result).toEqual([
      {
        id: processInstanceIds[0],
        hasIncidents: true,
      },
      {
        id: processInstanceIds[1],
        hasIncidents: true,
      },
    ]);
  });

  it('retrieves process instance incident data when processInstanceId is provided', async () => {
    const filterBody = {
      filter: {
        mockFilter: 'true',
        processInstanceId,
      },
      firstResult: 0,
      maxResults: 50,
    };
    const result = await controller.getProcessInstanceWithFilterBody(mockRequest, filterBody, 'true');

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstances).toHaveBeenCalledWith(
      {
        firstResult: filterBody.firstResult,
        maxResults: filterBody.maxResults,
        historicProcessInstanceQueryDto: filterBody.filter,
      },
      {},
    );
    expect(mockHistoricIncidentApi.getHistoricIncidents).toHaveBeenCalledWith(
      {
        processInstanceId: filterBody.filter.processInstanceId,
        open: true,
      },
      {},
    );
    expect(result).toEqual([
      {
        id: processInstanceId,
        hasIncidents: true,
      },
    ]);
  });

  it('passes an array even if only a string is provided', async () => {
    await controller.getProcessInstanceHistory(mockRequest, processInstanceId, allHistoryTypes[3]);

    expect(mockHistoricUserOperationLogApi.queryUserOperationEntries).toHaveBeenCalledWith(
      { processInstanceId, maxResults: 500 },
      {},
    );
  });

  it('retrieves all history if none is specified', async () => {
    await controller.getProcessInstanceHistory(mockRequest, processInstanceId);

    expect(mockHistoricUserOperationLogApi.queryUserOperationEntries).toHaveBeenCalledWith(
      { processInstanceId, maxResults: 500 },
      {},
    );
    expect(mockHistoricDetailApi.getHistoricDetails).toHaveBeenCalledWith({ processInstanceId, maxResults: 500 }, {});
    expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
      { processInstanceId, maxResults: 500 },
      {},
    );
    expect(mockHistoricIncidentApi.getHistoricIncidents).toHaveBeenCalledWith(
      { processInstanceId, maxResults: 500 },
      {},
    );
  });

  it('should delegate to the modifyProcessInstance method on ProcessInstanceApi', async () => {
    const body = {};
    await controller.processModification(mockRequest, processInstanceId, body);

    expect(mockProcessInstanceApi.modifyProcessInstance).toHaveBeenCalledWith(
      { id: processInstanceId, processInstanceModificationDto: body },
      {},
    );
  });

  it('should delegate to the updateSuspensionStateById method on ProcessInstanceApi', async () => {
    const body = { suspended: true };
    await controller.suspendOrActivate(mockRequest, processInstanceId, body);

    expect(mockProcessInstanceApi.updateSuspensionStateById).toHaveBeenCalledWith(
      { id: processInstanceId, suspensionStateDto: body },
      {},
    );
  });

  it('should delegate to the updateSuspensionStateAsyncOperation method on ProcessInstanceApi', async () => {
    const body = { processInstanceIds, suspended: true };
    await controller.bulkSuspendOrActivate(mockRequest, body);

    expect(mockProcessInstanceApi.updateSuspensionStateAsyncOperation).toHaveBeenCalledWith(
      { processInstanceSuspensionStateAsyncDto: body },
      {},
    );
  });

  it('should delegate to the deleteProcessInstance method on ProcessInstanceApi', async () => {
    const input = {
      skipCustomListeners: false,
      skipIoMappings: true,
      skipSubprocesses: false,
      failIfNotExists: true,
    } as ProcessInstanceTerminateRequest;
    await controller.terminate(mockRequest, processInstanceId, input);

    expect(mockProcessInstanceApi.deleteProcessInstance).toHaveBeenCalledWith({ id: processInstanceId, ...input }, {});
  });

  it('should delegate to the deleteProcessInstancesAsyncOperation method on ProcessInstanceApi', async () => {
    const input = {
      deleteReason: 'aReason',
      processInstanceIds: ['1234', '5678'],
      skipCustomListeners: false,
      skipSubprocesses: false,
      skipIoMappings: true,
    };
    await controller.bulkTerminate(mockRequest, input);

    expect(mockProcessInstanceApi.deleteProcessInstancesAsyncOperation).toHaveBeenCalledWith(
      { deleteProcessInstancesDto: input },
      {},
    );
  });

  it('should delegate to the queryProcessInstancesCount method on ProcessInstanceApi', async () => {
    const filters = { processDefinitionId: 'test-id' };
    await controller.getProcessInstanceCount(mockRequest, filters);

    expect(mockProcessInstanceApi.queryProcessInstancesCount).toHaveBeenCalledWith(
      { processInstanceQueryDto: filters },
      {},
    );
  });

  it('should pass array-based filters to queryProcessInstancesCount without transformation', async () => {
    const filters = {
      processInstanceIds: ['inst-1', 'inst-2', 'inst-3'],
      processDefinitionKeyIn: ['key1', 'key2'],
      tenantIdIn: ['tenant1', 'tenant2'],
      active: true,
    };
    await controller.getProcessInstanceCount(mockRequest, filters as any);

    expect(mockProcessInstanceApi.queryProcessInstancesCount).toHaveBeenCalledWith(
      { processInstanceQueryDto: filters },
      {},
    );
    // Verify arrays are NOT converted to comma-separated strings
    const call = mockProcessInstanceApi.queryProcessInstancesCount.mock.calls[0][0];
    expect(call.processInstanceQueryDto.processInstanceIds).toEqual(['inst-1', 'inst-2', 'inst-3']);
    expect(call.processInstanceQueryDto.processDefinitionKeyIn).toEqual(['key1', 'key2']);
    expect(call.processInstanceQueryDto.tenantIdIn).toEqual(['tenant1', 'tenant2']);
  });

  it('should pass complex filter with variables and sorting to queryProcessInstancesCount', async () => {
    const filters = {
      processDefinitionKey: 'myProcess',
      startedAfter: '2026-01-01T00:00:00.000Z',
      variables: [
        { name: 'status', operator: 'eq', value: 'active' },
        { name: 'amount', operator: 'gt', value: '1000' },
      ],
      variableNamesIgnoreCase: true,
      sorting: [{ sortBy: 'startTime', sortOrder: 'desc' }],
    };
    await controller.getProcessInstanceCount(mockRequest, filters as any);

    expect(mockProcessInstanceApi.queryProcessInstancesCount).toHaveBeenCalledWith(
      { processInstanceQueryDto: filters },
      {},
    );
    // Verify complex structures are passed through intact
    const call = mockProcessInstanceApi.queryProcessInstancesCount.mock.calls[0][0];
    expect(call.processInstanceQueryDto.variables).toHaveLength(2);
    expect(call.processInstanceQueryDto.variables[0]).toEqual({
      name: 'status',
      operator: 'eq',
      value: 'active',
    });
    expect(call.processInstanceQueryDto.sorting).toEqual([{ sortBy: 'startTime', sortOrder: 'desc' }]);
  });

  it('should delegate to the queryHistoricProcessInstancesCount method on HistoricProcessInstanceApi', async () => {
    const filters = { processDefinitionId: 'test-id' };
    await controller.getProcessInstanceHistoryCount(mockRequest, filters);

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstancesCount).toHaveBeenCalledWith(
      { historicProcessInstanceQueryDto: filters },
      {},
    );
  });

  it('should pass array-based filters to queryHistoricProcessInstancesCount without transformation', async () => {
    const filters = {
      processInstanceIds: ['inst-1', 'inst-2', 'inst-3', 'inst-4'],
      processDefinitionKeyIn: ['orderProcess', 'paymentProcess'],
      processDefinitionKeyNotIn: ['legacyProcess'],
      tenantIdIn: ['tenant-a', 'tenant-b'],
      finished: true,
    };
    await controller.getProcessInstanceHistoryCount(mockRequest, filters as any);

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstancesCount).toHaveBeenCalledWith(
      { historicProcessInstanceQueryDto: filters },
      {},
    );
    // Verify arrays are NOT converted to comma-separated strings
    const call = mockHistoricProcessInstanceApi.queryHistoricProcessInstancesCount.mock.calls[0][0];
    expect(call.historicProcessInstanceQueryDto.processInstanceIds).toEqual(['inst-1', 'inst-2', 'inst-3', 'inst-4']);
    expect(call.historicProcessInstanceQueryDto.processDefinitionKeyIn).toEqual(['orderProcess', 'paymentProcess']);
    expect(call.historicProcessInstanceQueryDto.processDefinitionKeyNotIn).toEqual(['legacyProcess']);
  });

  it('should pass complex historic filter with variables and sorting to queryHistoricProcessInstancesCount', async () => {
    const filters = {
      processDefinitionKey: 'invoice',
      startedAfter: '2026-01-01T00:00:00.000Z',
      finishedBefore: '2026-02-01T00:00:00.000Z',
      variables: [
        { name: 'customerType', operator: 'eq', value: 'premium' },
        { name: 'totalAmount', operator: 'gteq', value: '5000' },
      ],
      variableNamesIgnoreCase: true,
      variableValuesIgnoreCase: false,
      sorting: [
        { sortBy: 'startTime', sortOrder: 'desc' },
        { sortBy: 'duration', sortOrder: 'asc' },
      ],
      withIncidents: true,
    };
    await controller.getProcessInstanceHistoryCount(mockRequest, filters as any);

    expect(mockHistoricProcessInstanceApi.queryHistoricProcessInstancesCount).toHaveBeenCalledWith(
      { historicProcessInstanceQueryDto: filters },
      {},
    );
    // Verify complex structures are passed through intact
    const call = mockHistoricProcessInstanceApi.queryHistoricProcessInstancesCount.mock.calls[0][0];
    expect(call.historicProcessInstanceQueryDto.variables).toHaveLength(2);
    expect(call.historicProcessInstanceQueryDto.variables[1]).toEqual({
      name: 'totalAmount',
      operator: 'gteq',
      value: '5000',
    });
    expect(call.historicProcessInstanceQueryDto.sorting).toHaveLength(2);
    expect(call.historicProcessInstanceQueryDto.sorting[0]).toEqual({ sortBy: 'startTime', sortOrder: 'desc' });
  });

  describe('getProcessInstanceActivityInstances', () => {
    const activeActivityInstance = {};
    const historicalActivityInstances: ActivityInstanceHistory[] = [];

    beforeEach(() => {
      mockProcessInstanceApi.getActivityInstanceTree.mockResolvedValue({ data: activeActivityInstance });
      mockHistoricActivityInstanceApi.getHistoricActivityInstances.mockResolvedValue({
        data: historicalActivityInstances,
      });
    });

    it('gets the active and historical activity instances', async () => {
      const result = await controller.getProcessInstanceActivityInstances(mockRequest, processInstanceId, 'true');

      expect(mockProcessInstanceApi.getActivityInstanceTree).toHaveBeenCalledWith({ id: processInstanceId }, {});
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        {
          processInstanceId,
          firstResult: 0,
          maxResults: 1000,
          activityId: undefined,
          sortBy: 'startTime',
          sortOrder: 'desc',
        },
        {},
      );
      expect(result.active).toBe(activeActivityInstance);
      expect(result.historical).toStrictEqual(historicalActivityInstances);
    });

    it('includes activityId in history filter when in query parameter', async () => {
      const activityId = 'test-activity-id';

      const result = await controller.getProcessInstanceActivityInstances(
        mockRequest,
        processInstanceId,
        'true',
        activityId,
      );

      expect(mockProcessInstanceApi.getActivityInstanceTree).toHaveBeenCalledWith({ id: processInstanceId }, {});
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        { processInstanceId, firstResult: 0, maxResults: 1000, activityId, sortBy: 'startTime', sortOrder: 'desc' },
        {},
      );
      expect(result.active).toBe(activeActivityInstance);
      expect(result.historical).toStrictEqual(historicalActivityInstances);
    });

    it.each(['', 'false', 'some-other-string'])(
      'does not include history when "includeHistoricalInfo" is not "true" - testing "%p"',
      async (includeHistoricalInfo) => {
        const result = await controller.getProcessInstanceActivityInstances(
          mockRequest,
          processInstanceId,
          includeHistoricalInfo,
        );

        expect(mockProcessInstanceApi.getActivityInstanceTree).toHaveBeenCalledWith({ id: processInstanceId }, {});
        expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).not.toHaveBeenCalled();
        expect(result.active).toBe(activeActivityInstance);
        expect(result.historical).toEqual([]);
      },
    );
  });
});
