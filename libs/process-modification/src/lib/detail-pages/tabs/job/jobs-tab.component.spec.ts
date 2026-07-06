import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RowClickedEvent } from 'ag-grid-community';
import { ItemType, ListViewState } from '@fxn/types';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService, PermissionService, ToastService } from '@fxn/common';
import { toastServiceSpy } from '@fxn/test-support/vitest';
import { AgGridAngular } from 'ag-grid-angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { PimTab } from '../../item-detail-tab-utils';
import { JobsTabComponent } from './jobs-tab.component';

describe('JobsTabComponent', () => {
  let component: JobsTabComponent;
  let fixture: ComponentFixture<JobsTabComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;
  const jobId = 'jobId123';

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockConfirmActionService = {
    suspendOrActivateJob: vi.fn((ids: string[], action: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    retryJob: vi.fn((tenantId: string, ids: string[], lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    changeJobDueDate: vi.fn((id: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
  };

  const mockRouter = {
    navigate: vi.fn(),
    url: 'current-url',
  };

  const mockJobService = {
    updateSuspendStatus: vi.fn().mockReturnValue(of({})),
    getJobsByFilter: vi.fn(() => of([{ jobId: '1234', jobDefinitionId: 'job-definition-id-1' }])),
    getJobDefinitionsByFilter: vi.fn(() => of([{ id: 'job-definition-id-1', activityId: 'activity-id-1' }])),
    getJobCountByFilter: vi.fn(() => of(1)),
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({ jobId: 'asdf' }),
    snapshot: {
      params: {
        tenant: 'test-tenant-id',
      },
      queryParams: {},
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JobsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: JobService, useValue: mockJobService },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ItemDetailPageCommunicationService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: WINDOW, useValue: mockWindow },
        PermissionService,
      ],
      imports: [],
    });
    fixture = TestBed.createComponent(JobsTabComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should load data when the detailItem is set', async () => {
    component.detailItem = { id: '123', type: ItemType.ProcessInstance };
    await vi.runAllTimersAsync();
    expect(component.isLoading).toBe(true);
    expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
      filter: {
        processInstanceId: '123',
        sorting: [
          {
            sortBy: 'jobDueDate',
            sortOrder: 'desc',
          },
        ],
      },
      maxResults: 50,
      firstResult: 0,
    });
    component.eventBus.setDiagramRendered(true);
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual([
      { jobId: '1234', jobDefinitionId: 'job-definition-id-1', activityId: 'activity-id-1' },
    ]);
  });

  it('should set selectedJobId when the route is changed', async () => {
    expect(component.selectedItemId).toBeFalsy();
    component.detailItem = { id: '123', type: ItemType.ProcessInstance };
    await vi.runAllTimersAsync();
    mockRoute.queryParams.next({ jobId });
    expect(component.selectedItemId).toEqual(jobId);
  });

  it('should set selectedJob ID and navigate on job row selected', () => {
    component.onRowClick({ data: { activityId: 'activityId123' } } as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { activityId: 'activityId123', tab: 'jobs' },
    });
  });

  it('should set selectedJob ID to undefined and navigate on job row deselected', () => {
    component.onRowClick({} as RowClickedEvent);
    expect(component.selectedItemId).toEqual(undefined);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { activityId: undefined, tab: 'jobs' },
    });
  });

  it('should return true for canActivate if only 1 suspended row is selected', () => {
    component.onSelectionChanged([{ id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: true }]);
    expect(component.canActivate()).toEqual(true);
  });

  it('should return false for canActivate if only 1 active row is selected', () => {
    component.onSelectionChanged([{ id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: false }]);
    expect(component.canActivate()).toEqual(false);
  });

  it('should return true for canSuspend if only 1 active row is selected', () => {
    component.onSelectionChanged([{ id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: false }]);
    expect(component.canSuspend()).toEqual(true);
  });

  it('should return false for canSuspend if no rows are selected', () => {
    component.onSelectionChanged([]);
    expect(component.canSuspend()).toEqual(false);
  });

  it('should return false for canRetry if no rows are selected', () => {
    component.onSelectionChanged([]);
    expect(component.canSuspend()).toEqual(false);
  });

  it('should return false for canActivate if no rows are selected', () => {
    component.onSelectionChanged([]);
    expect(component.canActivate()).toEqual(false);
  });

  it('should return false for canSuspend if only 1 suspended row is selected', () => {
    component.onSelectionChanged([{ id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: true }]);
    expect(component.canSuspend()).toEqual(false);
  });

  it('should return false for suspend and activate if multiple jobs are selected that are both active and suspended', () => {
    component.onSelectionChanged([
      { id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: false },
      { id: 'jobId456', jobDefinition: { activityId: 'activityId123' }, suspended: true },
    ]);

    expect(component.canSuspend()).toEqual(false);
    expect(component.canActivate()).toEqual(false);
  });

  it('should return false for retry if multiple jobs are selected that have retries left', () => {
    component.onSelectionChanged([
      { id: jobId, jobDefinition: { activityId: 'activityId123' }, retries: 1 },
      { id: 'jobId456', jobDefinition: { activityId: 'activityId123' }, retries: 1 },
    ]);

    expect(component.canRetry()).toEqual(false);
  });

  it('should return true for canActivate for multiple selected rows that are suspended', () => {
    component.onSelectionChanged([
      { id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: true },
      { id: 'jobId456', jobDefinition: { activityId: 'activityId123' }, suspended: true },
    ]);
    expect(component.canActivate()).toEqual(true);
  });

  it('should return true for canSuspend for multiple selected rows that are active', () => {
    component.onSelectionChanged([
      { id: jobId, jobDefinition: { activityId: 'activityId123' }, suspended: false },
      { id: 'jobId456', jobDefinition: { activityId: 'activityId123' }, suspended: false },
    ]);

    expect(component.canSuspend()).toEqual(true);
  });

  it('should call the confirm action service when trying to suspend a job', async () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    await component.suspend();
    expect(mockConfirmActionService.suspendOrActivateJob).toHaveBeenCalledWith(
      ['1234'],
      'Suspend',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  it('should call the confirm action service when trying to activate a job', async () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    await component.activate();
    expect(mockConfirmActionService.suspendOrActivateJob).toHaveBeenCalledWith(
      ['1234'],
      'Activate',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  it("should call the confirm action service when trying to set a job's retry count", async () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    await component.retry();
    expect(mockConfirmActionService.retryJob).toHaveBeenCalledWith(
      mockRoute.snapshot.params.tenant,
      ['1234'],
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  it("should call the confirm action service when trying to change a job's due date", async () => {
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    await component.changeDueDate();
    expect(mockConfirmActionService.changeJobDueDate).toHaveBeenCalledWith(
      '1234',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  describe('set filteredActivityId', () => {
    beforeEach(() => {
      component.itemTable = {
        agGrid: {
          api: {
            getColumn: vi.fn().mockImplementation((field) => field === 'activityId'),
            setColumnFilterModel: vi.fn().mockResolvedValue(undefined),
            onFilterChanged: vi.fn(),
          },
        } as unknown as AgGridAngular,
      } as ItemsTableComponent;
    });

    it('should set the activityId filter when filteredActivityId is set', async () => {
      component.filteredActivityId = 'activity-xyz';

      expect(component.itemTable?.agGrid?.api.getColumn).toHaveBeenCalledWith('activityId');
      expect(component.itemTable?.agGrid?.api.setColumnFilterModel).toHaveBeenCalledWith('activityId', {
        filter: 'activity-xyz',
        type: 'equals',
      });
    });

    it('should clear the activityId filter when filteredActivityId is set to undefined', async () => {
      component.filteredActivityId = undefined;

      expect(component.itemTable?.agGrid?.api.getColumn).toHaveBeenCalledWith('activityId');
      expect(component.itemTable?.agGrid?.api.setColumnFilterModel).toHaveBeenCalledWith('activityId', null);
    });

    it('should not set activityId filter if agGrid is undefined', () => {
      component.itemTable = undefined as any;

      expect(() => (component.filteredActivityId = 'activity-xyz')).not.toThrow();
    });

    it('should not set activityId filter if table does not have activityId column', () => {
      component.itemTable = {
        agGrid: {
          api: {
            getColumn: vi.fn().mockReturnValue(undefined),
            setColumnFilterModel: vi.fn(),
            onFilterChanged: vi.fn(),
          },
        } as unknown as AgGridAngular,
      } as ItemsTableComponent;

      expect(() => (component.filteredActivityId = 'activity-xyz')).not.toThrow();
      expect(component.itemTable?.agGrid?.api.setColumnFilterModel).not.toHaveBeenCalled();
    });

    it('should apply filteredActivityId from query params on onGridReady', () => {
      (component as any).route = {
        snapshot: {
          queryParams: {
            filteredActivityId: 'activity-qp-1',
          },
        },
      };

      component.onGridReady();

      expect(component.itemTable?.agGrid?.api.getColumn).toHaveBeenCalledWith('activityId');
      expect(component.itemTable?.agGrid?.api.setColumnFilterModel).toHaveBeenCalledWith('activityId', {
        filter: 'activity-qp-1',
        type: 'equals',
      });
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessInstance;
    const tab = PimTab.Jobs;

    const storageKey = `${itemType}-detail-tab-${tab}.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return { columnState: [{ colId: 'id', pinned: true, width: 330 }], differentThanDefaults: true };

        return undefined;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      component.detailItem = { id: '123', type: itemType };
    });

    it('should load the column preferences from local storage', async () => {
      const listView = new ListViewState([{ colId: 'id', pinned: true, width: 330 }]);

      await vi.runAllTimersAsync();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', () => {
      const listView = new ListViewState([{ colId: 'id', pinned: false, width: 330 }]);

      component.columnPrefsUpdated(listView);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify({ columnState: listView.getColumnStates(), differentThanDefaults: true }),
      );
    });
  });

  describe('resetting the grid', () => {
    it('should reset the grid when reset grid button is clicked', () => {
      component.init();
      const resetUrlSpy = vi.spyOn(component, 'resetUrl');
      const mockItemTable = { resetColumnDefs: vi.fn() };
      component.itemTable = mockItemTable as unknown as ItemsTableComponent;
      component.onFilterChanged({ testFilter: 'test-value' });
      component.onSortChanged([{ sort: 'asc', colId: 'version' }]);

      component.onResetGridClick();

      expect(component.filters).toEqual({});
      expect(component.sorting).toEqual([{ colId: 'dueDate', sort: 'desc' }]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });

  describe('should handle user permissions', () => {
    it('should set `anyButtonVisible` to `true` if user has required permission', async () => {
      mockAuthHttpService.checkSync.mockResolvedValue(true);

      component.init();
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(component.anyButtonVisible).toBe(true);
    });

    it('should set `anyButtonVisible` to `false` if user DOES NOT have required permission', async () => {
      mockAuthHttpService.checkSync.mockResolvedValue(false);

      component.init();
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(component.anyButtonVisible).toBe(false);
    });
  });
});
