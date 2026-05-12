import { CompleteActivityInstanceInfo, ProcessInstance, Sorting, VariableSearchFilter } from '@fxn/types';
import { firstValueFrom, of } from 'rxjs';
import { downloadDataBuffer } from '@fxn/common/src/lib/utils';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { VariableService } from './variable.service';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

vi.mock('@fxn/common/src/lib/utils');

describe('VariableService', () => {
  let service: VariableService;
  let mockHttp: { post: Mock; get: Mock };
  const mockPIService: Mocked<ProcessInstanceService> = {
    getActivityInstances: vi.fn(() => of([])),
    getProcessInstance: vi.fn(() => of({})),
  } as unknown as Mocked<ProcessInstanceService>;
  const mockDownloadDataBuffer = vi.mocked(downloadDataBuffer);

  beforeEach(() => {
    mockHttp = {
      post: vi.fn(() => of([])),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        VariableService,
        { provide: ProcessInstanceService, useValue: mockPIService },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });
    service = TestBed.inject(VariableService);
    vi.clearAllMocks();
  });

  describe('getProcessVariablesByFilter', () => {
    it('given the process instance is active, should send post request to /variables with a filter', () => {
      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
        variableNameLike: 'env',
        sorting: [
          {
            sortBy: 'variableName',
            sortOrder: 'desc',
          },
        ],
      } as VariableSearchFilter;
      const req = new PaginatedDataRequest(variableSearchFilter);
      service.getProcessVariablesByFilter(req, true);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables', req);
    });

    it('given the process instance is not active, should send post request to /variables/variable-history with a filter', () => {
      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
        variableNameLike: 'env',
        sorting: [
          {
            sortBy: 'variableName',
            sortOrder: 'desc',
          } as Sorting,
        ],
      };
      const req = new PaginatedDataRequest(variableSearchFilter);
      service.getProcessVariablesByFilter(req, false);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables/variable-history', req);
    });
  });

  describe('getProcessVariableCountByFilter', () => {
    it('should retrieve variables for an active instance', () => {
      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
      };
      service.getProcessVariableCountByFilter(variableSearchFilter, true);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables/count', variableSearchFilter);
    });

    it('should retrieve variables for an active instance, called without explicit isActive arg', () => {
      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
      };
      service.getProcessVariableCountByFilter(variableSearchFilter, undefined);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables/count', variableSearchFilter);
    });

    it('should retrieve variables for a historical instance', () => {
      const getHistoricalVariableCountSpy = vi.spyOn(service, 'getHistoricalVariableCount');

      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
      };

      service.getProcessVariableCountByFilter(variableSearchFilter, false);

      expect(getHistoricalVariableCountSpy).toHaveBeenCalledTimes(1);
      expect(getHistoricalVariableCountSpy).toHaveBeenCalledWith(variableSearchFilter);

      getHistoricalVariableCountSpy.mockRestore();
    });
  });

  describe('getHistoricalVariables', () => {
    it('should retrieve data from variable-history, activity-instances, and process', () => {
      const variableHistoryFilter = {
        firstResult: 1,
        maxResults: 50,
        filters: {
          processInstanceIdIn: ['process123'],
        },
      };
      service.getHistoricalVariables(variableHistoryFilter, 'process123');
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables/variable-history', variableHistoryFilter);
      expect(mockPIService.getActivityInstances).toHaveBeenCalledWith(
        variableHistoryFilter.filters.processInstanceIdIn[0],
      );
      expect(mockPIService.getProcessInstance).toHaveBeenCalledWith(
        variableHistoryFilter.filters.processInstanceIdIn[0],
      );
    });

    it('merge the responses from the different services and add the scope property', async () => {
      const pid = 'process123';
      const variableHistoryFilter = {
        firstResult: 1,
        maxResults: 50,
        filters: {
          processInstanceIdIn: [pid],
        },
      };

      mockHttp.post.mockReturnValue(
        of([
          { value: 'scope is an activity', activityInstanceId: 'activity123' },
          { value: 'scope is the process', activityInstanceId: pid },
          { value: 'scope is unknown', activityInstanceId: 'unknown123' },
        ]),
      );
      mockPIService.getActivityInstances.mockReturnValue(
        of({
          historical: [{ id: 'activity123', activityName: 'MyActivity' }],
        } as unknown as CompleteActivityInstanceInfo),
      );
      mockPIService.getProcessInstance.mockReturnValue(
        of({ processDefinitionName: 'PDefName', id: pid } as unknown as ProcessInstance),
      );

      const results = await firstValueFrom(service.getHistoricalVariables(variableHistoryFilter, pid));
      expect(results[0]).toEqual({
        value: 'scope is an activity',
        activityInstanceId: 'activity123',
        scope: 'MyActivity',
        scopeType: 'Activity',
      });
      expect(results[1]).toEqual({
        value: 'scope is the process',
        activityInstanceId: 'process123',
        scope: 'PDefName',
        scopeType: 'Process',
      });
      expect(results[2]).toEqual({
        value: 'scope is unknown',
        activityInstanceId: 'unknown123',
        scope: 'unknown123',
        scopeType: undefined,
      });
    });
  });

  describe('getHistoricalVariableCount', () => {
    it('should retrieve historical variables', () => {
      const variableSearchFilter = {
        processInstanceIdIn: ['process123'],
      };
      service.getHistoricalVariableCount(variableSearchFilter);
      expect(mockHttp.post).toHaveBeenCalledTimes(1);
      expect(mockHttp.post).toHaveBeenCalledWith('api/variables/variable-history/count', variableSearchFilter);
    });
  });

  it('should send post request to /variables/update-process', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.updateProcessVariables(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/update-process', variable);
  });

  it('should send post request to /variables/update-task', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.updateTaskVariables(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/update-task', variable);
  });

  it('should send post request to /variables/update-execution', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.updateExecutionVariables(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/update-execution', variable);
  });

  it('should send post request to /variables/delete-process', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.deleteProcessVariable(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/delete-process', variable);
  });

  it('should send post request to /variables/delete-task', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.deleteTaskVariable(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/delete-task', variable);
  });

  it('should send post request to /variables/delete-execution', () => {
    const variable = {
      id: 'var1',
      name: 'var1',
    };
    service.deleteExecutionVariable(variable);
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
    expect(mockHttp.post).toHaveBeenCalledWith('api/variables/delete-execution', variable);
  });

  describe('downloadVariableValue', () => {
    it('For active instance, should send get request to /variables/:id/data and download resulting file', () => {
      const variable = {
        id: 'test-variable-id',
        processInstanceId: 'test-process-instance-id',
        name: 'test-variable-name',
        valueInfo: {
          filename: 'test-file-name',
        },
      };
      const mockSubscribe = vi.fn();
      mockHttp.get.mockReturnValueOnce({
        subscribe: mockSubscribe,
      });

      service.downloadVariableValue(variable, true);

      expect(mockHttp.get).toHaveBeenCalledWith(`api/variables/${variable.id}/data`, {
        responseType: 'arraybuffer',
      });
      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
      const subscribeNextCallback = mockSubscribe.mock.calls[0][0];
      const arrayBuffer = new ArrayBuffer(8);
      subscribeNextCallback(arrayBuffer);
      expect(mockDownloadDataBuffer).toHaveBeenCalledWith(arrayBuffer, variable.valueInfo.filename);
    });

    it('For historic instance, should send get request to /variables/history/:id/data and download resulting file', () => {
      const variable = {
        id: 'test-variable-id',
        processInstanceId: 'test-process-instance-id',
        name: 'test-variable-name',
        valueInfo: {
          filename: 'test-file-name',
        },
      };
      const mockSubscribe = vi.fn();
      mockHttp.get.mockReturnValueOnce({
        subscribe: mockSubscribe,
      });

      service.downloadVariableValue(variable, false);

      expect(mockHttp.get).toHaveBeenCalledWith(`api/variables/history/${variable.id}/data`, {
        responseType: 'arraybuffer',
      });
      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
      const subscribeNextCallback = mockSubscribe.mock.calls[0][0];
      const arrayBuffer = new ArrayBuffer(8);
      subscribeNextCallback(arrayBuffer);
      expect(mockDownloadDataBuffer).toHaveBeenCalledWith(arrayBuffer, variable.valueInfo.filename);
    });
  });
});
