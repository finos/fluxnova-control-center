import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityInstanceHistory, StaticCalledProcessDefinition } from '@fxn/types';
import { getCache } from '../../common';
import { ProcessDefinitionController } from './process-definition.controller';

const userOperationResponse = [
  {
    id: 'anUserOperationLogEntryId',
    deploymentId: 'aDeploymentId',
    processDefinitionId: 'aProcessDefinitionId',
    processDefinitionKey: 'aProcessDefinitionKey',
    processInstanceId: null,
    executionId: null,
    taskId: null,
    jobId: null,
    jobDefinitionId: null,
    userId: 'demo',
    timestamp: '2014-02-25T14:58:37.000+0200',
    operationId: 'anOperationId',
    operationType: 'Suspend',
    entityType: 'ProcessInstance',
    property: 'suspensionState',
    orgValue: null,
    newValue: 'suspended',
    removalTime: '2018-02-10T14:33:19.000+0200',
    rootProcessInstanceId: 'aRootProcessInstanceId',
    category: 'Operator',
    annotation: 'anAnnotation',
  },
] as unknown as any;

const activityInstanceResponse = [
  {
    activityId: 'anActivity',
    activityName: 'anActivityName',
    activityType: 'userTask',
    assignee: 'peter',
    calledProcessInstanceId: 'aHistoricCalledProcessInstanceId',
    calledCaseInstanceId: null,
    canceled: true,
    completeScope: false,
    durationInMillis: 2000,
    endTime: '2013-04-23T18:42:43.000+0200',
    executionId: 'anExecutionId',
    id: 'aHistoricActivityInstanceId',
    parentActivityInstanceId: 'aHistoricParentActivityInstanceId',
    processDefinitionId: 'aProcDefId',
    processInstanceId: 'aProcInstId',
    startTime: '2013-04-23T11:20:43.000+0200',
    taskId: 'aTaskId',
    tenantId: null,
    removalTime: '2018-02-10T14:33:19.000+0200',
    rootProcessInstanceId: 'aRootProcessInstanceId',
  },
] as unknown as any;

const incidentResponse = [
  {
    id: 'anIncidentId',
    processDefinitionId: 'aProcDefId',
    processInstanceId: 'aProcInstId',
    executionId: 'anExecutionId',
    createTime: '2014-03-01T08:00:00.000+0200',
    endTime: null,
    incidentType: 'failedJob',
    activityId: 'serviceTask',
    failedActivityId: 'serviceTask',
    causeIncidentId: 'aCauseIncidentId',
    rootCauseIncidentId: 'aRootCauseIncidentId',
    configuration: 'aConfiguration',
    historyConfiguration: 'aHistoryConfiguration',
    incidentMessage: 'anIncidentMessage',
    tenantId: null,
    jobDefinitionId: 'aJobDefinitionId',
    open: true,
    deleted: false,
    resolved: false,
    removalTime: null,
    rootProcessInstanceId: 'aRootProcessInstanceId',
    annotation: 'an annotation',
  },
] as unknown as any;

const processDefinitionId = 'asdf';

describe('ProcessDefinitionController', () => {
  let controller: ProcessDefinitionController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockProcessDefinitionApi = {
    getProcessDefinitions: vi.fn().mockResolvedValue({ data: [] }),
    getProcessDefinitionsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    submitForm: vi.fn().mockResolvedValue({ data: {} }),
    updateProcessDefinitionSuspensionStateById: vi.fn().mockResolvedValue({ data: null }),
    deleteProcessDefinition: vi.fn().mockResolvedValue({ data: null }),
    getProcessDefinitionBpmn20Xml: vi.fn().mockResolvedValue({ data: { bpmn20Xml: '<xml></xml>' } }),
    getActivityStatistics: vi.fn().mockResolvedValue({ data: [] }),
    getStaticCalledProcessDefinitions: vi.fn().mockResolvedValue({ data: [] }),
  };

  const mockHistoricActivityInstanceApi = {
    getHistoricActivityInstances: vi.fn().mockResolvedValue({ data: activityInstanceResponse }),
    getHistoricActivityInstancesCount: vi.fn().mockResolvedValue({ data: { count: 100 } }),
  };

  const mockHistoricUserOperationLogApi = {
    queryUserOperationEntries: vi.fn().mockResolvedValue({ data: userOperationResponse }),
    queryUserOperationCount: vi.fn().mockResolvedValue({ data: { count: 100 } }),
  };

  const mockHistoricIncidentApi = {
    getHistoricIncidents: vi.fn().mockResolvedValue({ data: incidentResponse }),
    getHistoricIncidentsCount: vi.fn().mockResolvedValue({ data: { count: 100 } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessDefinitionController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<ProcessDefinitionController>(ProcessDefinitionController);

    (controller as any).processDefinitionApi = mockProcessDefinitionApi;
    (controller as any).historicActivityInstanceApi = mockHistoricActivityInstanceApi;
    (controller as any).historicUserOperationLogApi = mockHistoricUserOperationLogApi;
    (controller as any).historicIncidentApi = mockHistoricIncidentApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the submit start form in the ProcessDefinitionApi', async () => {
    const input = {
      variables: {
        aVariable: {
          value: 'aStringValue',
          type: 'String',
        },
        anotherVariable: {
          value: true,
          type: 'Boolean',
        },
      },
      businessKey: 'myBusinessKey',
    };

    await controller.submitProcessDefinitionStartForm(mockRequest, processDefinitionId, input);

    expect(mockProcessDefinitionApi.submitForm).toHaveBeenCalledWith(
      { id: processDefinitionId, startProcessInstanceFormDto: input },
      {},
    );
  });

  describe('getProcessDefinitionHistory', () => {
    beforeEach(async () => {
      getCache('processDefinitionHistory').del('pd-history:asdf');
    });

    it('should get the activity instance history for only active instances', async () => {
      const result = await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, true);
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        { firstResult: 0, maxResults: 1000, processDefinitionId, unfinished: true },
        {},
      );

      expect(result).toEqual(expect.arrayContaining(activityInstanceResponse));
    });

    it('should get the activity instance history for all instances', async () => {
      const result = await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, false);
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        { firstResult: 0, maxResults: 1000, processDefinitionId, unfinished: false },
        {},
      );

      expect(result).toEqual(expect.arrayContaining(activityInstanceResponse));
    });

    it('should make multiple calls to get the activity instance history asynchronously if there are more than 1000 entries', async () => {
      mockHistoricActivityInstanceApi.getHistoricActivityInstancesCount.mockResolvedValueOnce({
        data: { count: 4000 },
      });

      await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, true);

      // Should make one call for every 1000 entries
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledTimes(4);
    });

    it('should cache the activity instance history when activeOnly is false', async () => {
      await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, false);
      await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, false);

      // Should only make one API call due to caching
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledTimes(1);
    });

    it('should not cache the activity instance history when activeOnly is true', async () => {
      await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, true);
      await controller.getProcessDefinitionHistory(mockRequest, processDefinitionId, true);

      // Should make two API calls since caching is disabled for active only
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProcessDefinitionStatistics', () => {
    it('should delegate to getActivityStatistics method on the ProcessDefinitionApi', async () => {
      await controller.getProcessDefinitionStatistics(mockRequest, processDefinitionId);

      expect(mockProcessDefinitionApi.getActivityStatistics).toHaveBeenCalledWith(
        { id: processDefinitionId, incidents: true },
        {},
      );
    });
  });

  describe('getProcessDefinitionWithFilterBody', () => {
    it('should delegate to getProcessDefinitions in ProcessDefinitionApi', async () => {
      const filtersAndPagination = {
        filter: {},
        firstResult: 0,
        maxResults: 50,
      };
      await controller.getProcessDefinitionWithFilterBody(mockRequest, filtersAndPagination);

      expect(mockProcessDefinitionApi.getProcessDefinitions).toHaveBeenCalledWith(
        { firstResult: 0, maxResults: 50 },
        {},
      );
    });
  });

  describe('getProcessDefinitionCount', () => {
    it('should delegate to getProcessDefinitionsCount in ProcessDefinitionApi', async () => {
      const filters = { key: 'test-key' };
      await controller.getProcessDefinitionCount(mockRequest, filters);

      expect(mockProcessDefinitionApi.getProcessDefinitionsCount).toHaveBeenCalled();
    });
  });

  describe('suspended', () => {
    it('should delegate to updateProcessDefinitionSuspensionStateById in ProcessDefinitionApi', async () => {
      const options = { suspended: true, includeProcessInstances: false };
      await controller.suspended(mockRequest, processDefinitionId, options);

      expect(mockProcessDefinitionApi.updateProcessDefinitionSuspensionStateById).toHaveBeenCalledWith(
        { id: processDefinitionId, processDefinitionSuspensionStateDto: options },
        {},
      );
    });
  });

  describe('deleteDefinition', () => {
    it('should delegate to deleteProcessDefinition in ProcessDefinitionApi', async () => {
      await controller.deleteDefinition(mockRequest, processDefinitionId, true, true, true);

      expect(mockProcessDefinitionApi.deleteProcessDefinition).toHaveBeenCalledWith(
        { id: processDefinitionId, cascade: true, skipCustomListeners: true, skipIoMappings: true },
        {},
      );
    });
  });

  describe('getProcessDefinitionDiagram', () => {
    it('should get BPMN XML and return formatted diagram object', async () => {
      const result = await controller.getProcessDefinitionDiagram(mockRequest, processDefinitionId);

      expect(mockProcessDefinitionApi.getProcessDefinitionBpmn20Xml).toHaveBeenCalledWith(
        { id: processDefinitionId },
        {},
      );
      expect(result).toEqual({
        name: '',
        definitionId: processDefinitionId,
        xml: '<xml></xml>',
      });
    });
  });

  describe('getProcessDefinitionDiagramXML', () => {
    it('should get BPMN XML and return raw XML string', async () => {
      const result = await controller.getProcessDefinitionDiagramXML(mockRequest, processDefinitionId);

      expect(mockProcessDefinitionApi.getProcessDefinitionBpmn20Xml).toHaveBeenCalledWith(
        { id: processDefinitionId },
        {},
      );
      expect(result).toBe('<xml></xml>');
    });
  });

  describe('getCalledProcessDefinitions', () => {
    const activityId = 'test-activity-id';
    const staticCalledProcessDefinitions: StaticCalledProcessDefinition[] = [
      { id: 'test-id', name: 'test-name', calledFromActivityIds: [] },
      { id: 'test-id-2', name: 'test-name-2', calledFromActivityIds: [activityId] },
    ];
    const activityInstanceHistory: ActivityInstanceHistory[] = [];

    beforeEach(() => {
      mockProcessDefinitionApi.getStaticCalledProcessDefinitions.mockResolvedValue({
        data: staticCalledProcessDefinitions,
      });
      mockHistoricActivityInstanceApi.getHistoricActivityInstances.mockResolvedValue({ data: activityInstanceHistory });
    });

    it('gets static called process definitions and activity instance history', async () => {
      const result = await controller.getCalledProcessDefinitions(mockRequest, { filter: { processDefinitionId } });

      expect(mockProcessDefinitionApi.getStaticCalledProcessDefinitions).toHaveBeenCalledWith(
        { id: processDefinitionId },
        {},
      );
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        { processDefinitionId },
        {},
      );
      expect(result[0]).toBe(staticCalledProcessDefinitions);
      expect(result[1]).toBe(activityInstanceHistory);
    });

    it('filters the static called process definitions when filter includes activityId', async () => {
      const result = await controller.getCalledProcessDefinitions(mockRequest, {
        filter: { processDefinitionId, activityId },
      });

      expect(mockProcessDefinitionApi.getStaticCalledProcessDefinitions).toHaveBeenCalledWith(
        { id: processDefinitionId },
        {},
      );
      expect(mockHistoricActivityInstanceApi.getHistoricActivityInstances).toHaveBeenCalledWith(
        { processDefinitionId, activityId },
        {},
      );
      expect(result[0]).toEqual([staticCalledProcessDefinitions[1]]);
      expect(result[1]).toBe(activityInstanceHistory);
    });
  });
});
