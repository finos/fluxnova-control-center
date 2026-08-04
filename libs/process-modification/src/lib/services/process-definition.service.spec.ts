import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ProcessDefinitionService } from './process-definition.service';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

describe('Process Definition Service', () => {
  let service: ProcessDefinitionService;
  const mockHttp = {
    get: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
  } as unknown as Mocked<HttpClient>;
  const mockProcessInstanceService = {
    getProcessInstance: vi.fn(() => of([{ processDefinitionId: 'process-definition-id-2' }])),
  } as unknown as Mocked<ProcessInstanceService>;
  const staticCalledProcessInstances = [
    {
      id: 'static-id-1',
      name: 'static-name-1',
      calledFromActivityIds: ['activity-id-1'],
    },
  ];

  const activityInstances = [
    {
      id: 'activity-instance-1',
      activityId: 'activity-id-1',
      activityName: 'activity-name-1',
      processInstanceId: 'process-instance-1',
      name: 'activity-instance-name-1',
      activityType: 'callActivity',
    },
  ];

  const activityInstancesWithOrphan = [
    {
      id: 'activity-instance-1',
      activityId: 'activity-id-1',
      activityName: 'activity-name-1',
      processInstanceId: 'process-instance-1',
      processDefinitionId: 'process-definition-id-1',
      name: 'activity-instance-name-1',
      activityType: 'callActivity',
      calledProcessInstanceId: 'called-process-instance-id-1',
    },
    {
      id: 'activity-instance-2',
      activityId: 'activity-id-2',
      activityName: 'activity-name-2',
      processInstanceId: 'process-instance-2',
      name: 'activity-instance-name-2',
      activityType: 'callActivity',
      calledProcessInstanceId: 'called-process-instance-id-2',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProcessDefinitionService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
      ],
    });

    service = TestBed.inject(ProcessDefinitionService);

    vi.clearAllMocks();
  });

  it('should return correct observables depending on id passed to getProcessDefinitionVersionsById', () => {
    const id = '1234';
    mockHttp.post.mockReturnValue(of([{ key: 'testingKey' }]));

    const result = service.getProcessDefinitionVersionsById(id).subscribe();
    expect(mockHttp.post).toHaveBeenCalledTimes(2);
    expect(result).toBeTruthy();
  });

  describe('getStatistics', () => {
    it('should call the process-definitions/statistics service and return an Observable', async () => {
      const definitionId = '1234';
      const result = service.getStatistics(definitionId);

      expect(mockHttp.get).toHaveBeenCalledWith(`api/process-definitions/${definitionId}/statistics`);
      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('getProcessDefinitionCountByFilter', () => {
    it('should call the process-definitions/count service and return an Observable', async () => {
      const definitionId = '1234';
      const result = service.getProcessDefinitionCountByFilter({ processDefinitionId: definitionId });

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-definitions/count`, { processDefinitionId: '1234' });
      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('getProcessDefinitionById', () => {
    it('should call the process-definitions service with the correct filter and return an Observable', async () => {
      const definitionId = '1234';
      const result = service.getProcessDefinitionById(definitionId);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-definitions`, {
        filter: { processDefinitionId: '1234' },
        firstResult: 0,
        maxResults: 1,
      });
      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('getProcessDefinitionVersionsByKey', () => {
    it('should call the process-definitions service with the correct filter and return an Observable', async () => {
      const definitionId = '1234';
      const result = service.getProcessDefinitionVersionsByKey(definitionId);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-definitions`, {
        filter: {
          key: '1234',
          sortBy: 'version',
          sortOrder: 'asc',
        },
        firstResult: 0,
        maxResults: 1000,
      });
      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('submitStartFormWithDefinitionId', () => {
    it('should call the process-definitions service and return an observable', async () => {
      const definitionId = '1234';
      const payload = {};

      const result = service.submitStartFormWithDefinitionId(definitionId, payload);

      expect(mockHttp.post).toHaveBeenCalledWith(`api/process-definitions/${definitionId}/start`, {});

      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('getActivityInstanceHistory', () => {
    it('should call the process-definitions service with the correct params and return an Observable', async () => {
      const definitionId = '1234';
      const result = service.getActivityInstanceHistory(definitionId);

      expect(mockHttp.get).toHaveBeenCalledWith(`api/process-definitions/1234/history`, {
        params: {
          activeOnly: 'false',
        },
      });
      expect(result instanceof Observable).toBeTruthy();
    });
  });

  describe('getCalledProcessDefinitions', () => {
    it('should call getCalledProcessDefinitions', () => {
      const id = '1234';
      const req = new PaginatedDataRequest({ processDefinitionId: id, unfinished: true });
      const result = service.getCalledProcessDefinitions(req);

      expect(mockHttp.post).toHaveBeenCalledWith('api/process-definitions/called-process-definitions', {
        filter: {
          processDefinitionId: id,
          unfinished: true,
        },
        firstResult: 0,
        maxResults: 50,
      });
      expect(result).toBeTruthy();
    });

    it('should get called process definitions when there are no activity instances', async () => {
      vi.spyOn(mockHttp, 'post').mockImplementationOnce(() => of([staticCalledProcessInstances, []]));
      const req = new PaginatedDataRequest({ processDefinitionId: 'test-process-definition-id' });

      const result = await firstValueFrom(service.getCalledProcessDefinitions(req));
      expect(result).toEqual([
        {
          ...staticCalledProcessInstances[0],
          activityId: 'activity-id-1',
          state: 'Referenced',
          calledProcessDefinitionId: 'activity-id-1:static-id-1',
        },
      ]);
    });

    it('should get called process definitions when there are activity instances', async () => {
      vi.spyOn(mockHttp, 'post').mockImplementationOnce(() => of([staticCalledProcessInstances, activityInstances]));
      const req = new PaginatedDataRequest({ processDefinitionId: 'test-process-definition-id' });
      const result = await firstValueFrom(service.getCalledProcessDefinitions(req));
      expect(result).toEqual([
        {
          ...staticCalledProcessInstances[0],
          activityId: 'activity-id-1',
          state: 'Running and referenced',
          calledProcessDefinitionId: 'activity-id-1:static-id-1',
        },
      ]);
    });

    it('should get called process definitions when there are orphan activity instances', async () => {
      vi.spyOn(mockHttp, 'post').mockImplementationOnce(() =>
        of([staticCalledProcessInstances, activityInstancesWithOrphan]),
      );
      vi.spyOn(service, 'getProcessDefinitionById').mockImplementationOnce(() =>
        of({ id: 'process-definition-id-2', name: 'process-definition-name-2' }),
      );
      const req = new PaginatedDataRequest({ processDefinitionId: 'test-process-definition-id' });
      const result = await firstValueFrom(service.getCalledProcessDefinitions(req));
      expect(result).toEqual([
        {
          ...staticCalledProcessInstances[0],
          activityId: 'activity-id-1',
          state: 'Running and referenced',
          calledProcessDefinitionId: 'activity-id-1:static-id-1',
        },
        {
          activityId: 'activity-id-2',
          state: 'Running',
          id: 'process-definition-id-2',
          name: 'process-definition-name-2',
          calledProcessDefinitionId: 'activity-id-2:process-definition-id-2',
        },
      ]);
    });
  });
});
