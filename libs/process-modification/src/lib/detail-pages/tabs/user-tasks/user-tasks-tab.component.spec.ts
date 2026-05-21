import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { PermissionService, ToastService } from '@fxn/common';
import { toastServiceSpy } from '@fxn/test-support/vitest';
import { RowClassParams, RowClickedEvent } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { UserTaskService } from '../../../services/user-task.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { UserTasksTabComponent } from './user-tasks-tab.component';

describe('UserTasksTabComponent', () => {
  let component: UserTasksTabComponent;
  let fixture: ComponentFixture<UserTasksTabComponent>;

  const mockRouter = {
    navigate: vi.fn(),
    url: 'current-url',
  };

  const mockUserTaskService = {
    getUserTasksByFilter: vi.fn(() => of([{ id: '1234', definitionKey: 'user-task-def-1' }])),
    getUserTaskCountByFilter: vi.fn(() => of(1)),
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({ taskId: 'asdf' }),
    snapshot: {
      queryParams: {},
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserTasksTabComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: UserTaskService, useValue: mockUserTaskService },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ItemDetailPageCommunicationService },
        PermissionService,
      ],
    });
    fixture = TestBed.createComponent(UserTasksTabComponent);
    component = fixture.componentInstance;

    (component as any).highlightedActivityId = undefined;
    (component as any).selectedItemId = undefined;

    (component as any).eventBus = {
      rowClickedWithActivity: vi.fn(),
    };

    fixture.detectChanges();
    vi.clearAllMocks();
  });

  it('should call getTasksByFilter with expected PaginatedDataRequest', async () => {
    const getTaskByFilterSpy = vi.spyOn(mockUserTaskService, 'getUserTasksByFilter');
    const expectedRequest = new PaginatedDataRequest({
      filter: {
        processInstanceId: component.detailItemId,
        sortBy: component.sortBy,
        sortOrder: component.sortOrder,
      },
      firstResult: 0,
      maxResults: 100,
    });
    await firstValueFrom(component.dataService(expectedRequest));
    expect(getTaskByFilterSpy).toHaveBeenCalledWith(expectedRequest);
  });

  it('should set PimTab to UserTasks', () => {
    expect(component.tab).toBe('user-tasks');
  });

  it('should set rowItemQueryParam to UserTasks', () => {
    expect(component.rowItemQueryParam).toBe('userTaskId');
  });

  it('should call eventBus and navigate with activity and row id on row click', async () => {
    const event: Partial<RowClickedEvent> = {
      data: {
        taskDefinitionKey: 'activity-1',
        id: 'task-1',
      },
    };

    await component.onRowClick(event as RowClickedEvent);

    expect((component as any).eventBus.rowClickedWithActivity).toHaveBeenCalledWith('activity-1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        replaceUrl: true,
        queryParams: expect.objectContaining({
          activityId: 'activity-1',
          [component.rowItemQueryParam]: 'task-1',
          tab: component.tab.toLowerCase(),
        }),
      }),
    );
  });

  it('should clear query params when clicking the same highlighted row', async () => {
    (component as any).highlightedActivityId = 'activity-1';
    (component as any).selectedItemId = 'task-1';

    const event: Partial<RowClickedEvent> = {
      data: {
        taskDefinitionKey: 'activity-1',
        id: 'task-1',
      },
    };

    await component.onRowClick(event as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        replaceUrl: true,
        queryParams: expect.objectContaining({
          activityId: undefined,
          [component.rowItemQueryParam]: undefined,
          tab: component.tab.toLowerCase(),
        }),
      }),
    );
  });

  it('should apply row-highlighted class only when activity and id match', () => {
    (component as any).highlightedActivityId = 'activity-1';
    (component as any).selectedItemId = 'task-1';

    const rulesFactory = component.rowClassRules;
    const rules = rulesFactory();

    const matchingParams: Partial<RowClassParams> = {
      data: { taskDefinitionKey: 'activity-1', id: 'task-1' },
    };
    const nonMatchingParams: Partial<RowClassParams> = {
      data: { taskDefinitionKey: 'activity-2', id: 'task-2' },
    };

    expect(rules['row-highlighted'](matchingParams as RowClassParams)).toBe(true);
    expect(rules['row-highlighted'](nonMatchingParams as RowClassParams)).toBe(false);
  });

  describe('filteredActivityId', () => {
    afterEach(() => {
      mockRoute.snapshot.queryParams = {};
    });

    it('should include activityId in dataFilter when filteredActivityId is set', () => {
      mockRoute.snapshot.queryParams = { filteredActivityId: 'activity-123' };

      expect(component.dataFilter).toMatchObject({ activityId: 'activity-123' });
    });

    it('should not include activityId in dataFilter when filteredActivityId is absent', () => {
      mockRoute.snapshot.queryParams = {};

      expect(component.dataFilter).not.toHaveProperty('activityId');
    });

    it('should call getUserTasksByFilter with activityId filter when loadData is called', () => {
      mockRoute.snapshot.queryParams = { filteredActivityId: 'activity-123' };
      const spy = vi.spyOn(mockUserTaskService, 'getUserTasksByFilter');

      component.loadData();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ activityId: 'activity-123' }),
        }),
      );
    });
  });
});
