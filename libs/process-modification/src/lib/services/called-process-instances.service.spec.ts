import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ActivityInstanceHistory, CompleteActivityInstanceInfo, ProcessInstance } from '@fxn/types';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { PaginatedDataRequest, ProcessInstanceService } from '../../index';
import { CalledProcessInstancesService } from './called-process-instances.service';

describe('StaticCalledProcessInstancesService', () => {
  let service: CalledProcessInstancesService;
  let processInstanceService: Mocked<ProcessInstanceService>;

  const mockProcessInstanceService = {
    getActivityInstances: vi.fn(),
    getProcessInstancesByFilter: vi.fn(() => of([])),
    getProcessInstancesWithIncidentInfo: vi.fn(() => of([])),
    getProcessInstanceHistoryCountByFilter: vi.fn(() => of(0)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalledProcessInstancesService,
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
      ],
    });

    service = TestBed.inject(CalledProcessInstancesService);
    processInstanceService = TestBed.inject(ProcessInstanceService) as Mocked<ProcessInstanceService>;
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRowDataList', () => {
    it('should return row data list when there are activity instances', async () => {
      const processInstanceId = 'test-id';
      const activityInstances: ActivityInstanceHistory[] = [
        {
          calledProcessInstanceId: '1',
          activityName: 'Activity 1',
          activityId: 'Activity_1',
        } as ActivityInstanceHistory,
        {
          calledProcessInstanceId: '2',
          activityName: 'Activity 2',
          activityId: 'Activity_2',
        } as ActivityInstanceHistory,
      ];
      const processInstances: ProcessInstance[] = [
        { id: '1', processDefinitionName: 'Process 1', state: 'Completed', hasIncidents: false },
        { id: '2', processDefinitionName: 'Process 2', state: 'Active', hasIncidents: true },
      ];
      const calledProcessInstances: ProcessInstance[] = [
        {
          id: '1',
          processDefinitionName: 'Process 1',
          state: 'Completed',
          hasIncidents: false,
          activityId: 'Activity_1',
        },
        { id: '2', processDefinitionName: 'Process 2', state: 'Active', hasIncidents: true, activityId: 'Activity_2' },
      ];

      processInstanceService.getActivityInstances.mockReturnValueOnce(
        of({ historical: activityInstances } as CompleteActivityInstanceInfo),
      );
      processInstanceService.getProcessInstancesWithIncidentInfo.mockReturnValueOnce(of(processInstances));

      const rowData = await firstValueFrom(
        service.getRowDataList(new PaginatedDataRequest({ processInstanceId: processInstanceId })),
      );
      const param = processInstanceService.getProcessInstancesWithIncidentInfo.mock.calls[0][0];

      expect(param.filter).toEqual(
        expect.objectContaining({
          processInstanceIds: ['1', '2'],
          superProcessInstanceId: processInstanceId,
        }),
      );
      expect(param.maxResults).toBe(50);
      expect(param.firstResult).toBe(0);
      expect(rowData).toEqual(calledProcessInstances);
    });

    it('should return row data list as empty list when there are no activity instances', async () => {
      const processInstanceId = 'test-id';
      const activityInstances: ActivityInstanceHistory[] = [];
      const processInstances: ProcessInstance[] = [];
      const expectedRowData: (ActivityInstanceHistory & ProcessInstance)[] = [];

      processInstanceService.getActivityInstances.mockReturnValueOnce(
        of({ historical: activityInstances } as CompleteActivityInstanceInfo),
      );
      processInstanceService.getProcessInstancesByFilter.mockReturnValueOnce(of(processInstances));

      const rowData = await firstValueFrom(service.getRowDataList(new PaginatedDataRequest({ processInstanceId })));
      expect(rowData).toEqual(expectedRowData);
    });
  });

  describe('getCalledProcessInstanceCount', () => {
    it('should call processInstanceService.getProcessInstanceHistoryCountByFilter when not filtering by activityId', async () => {
      const filter = {
        processInstanceId: '123',
        completed: true,
      };

      mockProcessInstanceService.getProcessInstanceHistoryCountByFilter.mockReturnValueOnce(of(1));

      service.getCalledProcessInstanceCount(filter).subscribe();

      await vi.runAllTimersAsync();

      expect(processInstanceService.getProcessInstanceHistoryCountByFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          superProcessInstanceId: '123',
        }),
      );
    });

    it('should call processInstanceService.getActivityInstances when filtering by activityId', async () => {
      const filter = {
        processInstanceId: '123',
        activityId: 'testActivity',
        completed: true,
      };

      mockProcessInstanceService.getActivityInstances.mockReturnValueOnce(
        of({
          active: {},
          historical: [
            {
              calledProcessInstanceId: '12345',
            },
          ],
        } as CompleteActivityInstanceInfo),
      );

      service.getCalledProcessInstanceCount(filter).subscribe();

      await vi.runAllTimersAsync();

      expect(processInstanceService.getActivityInstances).toHaveBeenCalledWith('123', 'testActivity');
    });
  });
});
