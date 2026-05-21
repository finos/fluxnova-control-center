import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastService } from '@fxn/common';
import { ProcessInstanceTerminateRequest } from '@fxn/types';
import { Observable, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { HistoryTabService } from '../detail-pages/tabs/history/history-tab.service';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

const mockHistoryTabService = {
  combineAndOrderHistoryData: vi.fn(),
} as unknown as HistoryTabService;

describe('Process Instance Service', () => {
  let service: ProcessInstanceService;
  const mockHttp = {
    get: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
    put: vi.fn(() => of({})),
  } as unknown as Mocked<HttpClient>;
  const mockToastService = {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as Mocked<ToastService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessInstanceService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: ToastService, useValue: mockToastService },
        { provide: HistoryTabService, useValue: mockHistoryTabService },
      ],
    });

    service = TestBed.inject(ProcessInstanceService);

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  describe('getProcessInstancesByFilter', () => {
    it('should call the process-instances service and return an Observable', async () => {
      const processInstanceId = '1234';
      const req = new PaginatedDataRequest({ processInstanceId });
      const result = service.getProcessInstancesByFilter(req);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances`, req);
      expect(result).toBeTruthy();
    });

    it('should call the process-instances service with default settings and return an Observable', async () => {
      const req = new PaginatedDataRequest({});
      const result = service.getProcessInstancesByFilter(req);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances`, {
        filter: {},
        firstResult: 0,
        maxResults: 50,
      });
      expect(result).toBeTruthy();
    });

    it('should have the default firstResult and maxResults', () => {
      const req = new PaginatedDataRequest({ processInstanceIds: ['1234'] });
      service.getProcessInstancesByFilter(req);
      expect(mockHttp.post).toHaveBeenCalledWith('api/process-instances', {
        filter: {
          processInstanceIds: ['1234'],
        },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('getProcessInstancesWithIncidentInfo', () => {
    it('should call the process-instances service and return an Observable', async () => {
      const processInstanceId = '1234';
      const req = new PaginatedDataRequest({ processInstanceId });
      const result = service.getProcessInstancesWithIncidentInfo(req);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances?includeIncidentInfo=true`, req);
      expect(result).toBeTruthy();
    });

    it('should call the process-instances service with default settings and return an Observable', async () => {
      const req = new PaginatedDataRequest({});
      const result = service.getProcessInstancesWithIncidentInfo(req);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances?includeIncidentInfo=true`, {
        filter: {},
        firstResult: 0,
        maxResults: 50,
      });
      expect(result).toBeTruthy();
    });

    it('should have the default firstResult and maxResults', () => {
      const req = new PaginatedDataRequest({ processInstanceIds: ['1234'] });
      service.getProcessInstancesWithIncidentInfo(req);
      expect(mockHttp.post).toHaveBeenCalledWith('api/process-instances?includeIncidentInfo=true', {
        filter: {
          processInstanceIds: ['1234'],
        },
        firstResult: 0,
        maxResults: 50,
      } as unknown as PaginatedDataRequest);
    });
  });

  describe('get single process instance', () => {
    it('should call get process instances with max of 1', () => {
      const result = service.getProcessInstance('1234');

      expect(mockHttp.post).toHaveBeenCalledWith('api/process-instances', {
        filter: {
          processInstanceId: '1234',
        },
        firstResult: 0,
        maxResults: 1,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('getActvityInstances', () => {
    it('should call the process-instances/${id}/activity-instances service always with includeHistoricalInfo param', () => {
      const processInstanceId = 'test-process-instance-id';

      const result = service.getActivityInstances(processInstanceId);

      const calls = mockHttp.get.mock.calls;
      expect(calls).toHaveLength(1);
      const [url, options] = calls[0];
      expect(url).toBe(`api/process-instances/${processInstanceId}/activity-instances`);
      expect((options?.params as HttpParams)?.get('includeHistoricalInfo')).toBe('true');
      expect(result).toBeInstanceOf(Observable);
    });

    it('should call the process-instances/${id}/activity-instances service with activityId when included', () => {
      const processInstanceId = 'test-process-instance-id';
      const activityId = 'test-activity-id';

      const result = service.getActivityInstances(processInstanceId, activityId);

      const calls = mockHttp.get.mock.calls;
      expect(calls).toHaveLength(1);
      const [url, options] = calls[0];
      expect(url).toBe(`api/process-instances/${processInstanceId}/activity-instances`);
      expect((options?.params as HttpParams)?.get('includeHistoricalInfo')).toBe('true');
      expect((options?.params as HttpParams)?.get('activityId')).toBe(activityId);
      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('getFullHistory', () => {
    it('should call the process-instances/1234/history service and return an Observable', async () => {
      const processInstanceId = '1234';
      const result = service.getFullHistory(processInstanceId);
      const params = {
        getAllResults: false,
        typeFilters: [],
      };

      expect(mockHttp.get).toHaveBeenCalledWith(`api/process-instances/${processInstanceId}/history`, { params });
      expect(result).toBeTruthy();
    });

    it('should get full history count', async () => {
      const combineSpy = vi.spyOn(service.historyTabService, 'combineAndOrderHistoryData');
      const processInstanceId = '1234';
      const result = service.getFullHistoryCount(processInstanceId).subscribe();
      await vi.runAllTimersAsync();
      expect(combineSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });
  });

  describe('getProcessInstanceCountByFilter', () => {
    it('should call the process-instances/history/count service with the correct filter and return an Observable', async () => {
      const processInstanceId = '1234';
      const result = service.getProcessInstanceHistoryCountByFilter({
        processInstanceIds: [processInstanceId],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/history/count`, {
        processInstanceIds: [processInstanceId],
      });
      expect(result).toBeTruthy();
    });

    it('should call the process-instances/count service with the correct filter and return an Observable', async () => {
      const processInstanceId = '1234';
      const result = service.getProcessInstanceCountByFilter({
        processInstanceIds: [processInstanceId],
      });

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/count`, {
        processInstanceIds: [processInstanceId],
      });
      expect(result).toBeTruthy();
    });
  });

  describe('postProcessModification', () => {
    it('should call the process-instances/:id/modification service with the correct filter and return an Observable', async () => {
      const processInstanceId = '1234';
      const result = service.postProcessModification(processInstanceId, {});

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/1234/modification`, {});
      expect(result).toBeTruthy();
    });
  });

  describe('suspendOrActivate', () => {
    it('should call the process-instances/:id/suspended service with the correct filter and return an Observable', async () => {
      const processInstanceId = '1234';
      const result = service.suspendOrActivate('test-tenant-id', [processInstanceId], true);

      expect(mockHttp.put).toHaveBeenCalledWith(`api/process-instances/1234/suspended`, { suspended: true });
      expect(result).toBeTruthy();
    });

    it('on multiple ids, taps observable to show success toast with link to batch', () => {
      const processInstanceIds = ['test-id-1', 'test-id-2'];
      const postResult = { id: 'test-batch-id' };
      const testTenantId = 'test-tenant-id';
      mockHttp.post.mockReturnValueOnce(of(postResult));

      const observable = service.suspendOrActivate(testTenantId, processInstanceIds, true);
      observable.subscribe();

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/suspended-async`, {
        processInstanceIds,
        suspended: true,
      });
      expect(mockToastService.success).toHaveBeenCalledWith(
        expect.stringContaining(`href="${testTenantId}/batches/test-batch-id"`),
        { delay: 10000 },
      );
    });
  });

  describe('bulkSuspendOrActivate', () => {
    it('should call the process-instances/suspended-async service with the correct filter and return an Observable', async () => {
      const processInstanceIds = ['1234', 'abcde'];
      const result = service.suspendOrActivate('test-tenant-id', processInstanceIds, true);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/suspended-async`, {
        processInstanceIds: processInstanceIds,
        suspended: true,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('bulkTerminate', () => {
    it('should call the process-instances/delete service with the correct params and return an Observable', async () => {
      const input = {
        deleteReason: 'aReason',
        processInstanceIds: ['1234', 'abcde'],
        skipCustomListeners: false,
        skipSubprocesses: false,
        failIfNotExists: false,
      } as ProcessInstanceTerminateRequest;
      const result = service.terminate('test-tenant-id', input);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/delete`, input);
      expect(result).toBeTruthy();
    });

    it('on multiple ids, taps observable to show success toast with link to batch', () => {
      const params = { processInstanceIds: ['test-id-1', 'test-id-2'] } as ProcessInstanceTerminateRequest;
      const postResult = { id: 'test-batch-id' };
      const testTenantId = 'test-tenant-id';
      mockHttp.post.mockReturnValueOnce(of(postResult));

      const observable = service.terminate(testTenantId, params);
      observable.subscribe();

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-instances/delete`, params);
      expect(mockToastService.success).toHaveBeenCalledWith(
        expect.stringContaining(`href="${testTenantId}/batches/test-batch-id"`),
        { delay: 10000 },
      );
    });
  });
});
