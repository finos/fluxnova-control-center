import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService, ConfirmModalService, ToastService } from '@fxn/common';
import { cloneDeep } from 'lodash-es';
import { ModuleRegistry } from 'ag-grid-community';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ListViewState } from '@fxn/types';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { AG_GRID_MODULES } from '@fxn/grid';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { BatchService } from '../../services/support/batch.service';
import { JobService } from '../../services/job.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { BatchListComponent } from './batch-list.component';

ModuleRegistry.registerModules(AG_GRID_MODULES);

describe('BatchListPageComponent', () => {
  let component: BatchListComponent;
  let fixture: ComponentFixture<BatchListComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockSelected = [
    { id: 'testId1', batchJobDefinitionId: 1, suspended: true },
    { id: 'testId2', batchJobDefinitionId: 2, suspended: true },
    { id: 'testId3', batchJobDefinitionId: 2, suspended: true },
  ];

  const qp$ = new BehaviorSubject({});

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockRoute = {
    queryParams: qp$,
  };
  const mockItemTable = {
    resetColumnDefs: vi.fn(),
  } as unknown as Mocked<ItemsTableComponent>;

  const mockCompletedItemTable = {
    resetColumnDefs: vi.fn(),
  } as unknown as Mocked<ItemsTableComponent>;

  const mockRouter = {
    navigate: vi.fn((arry: [], opts: any) => {
      qp$.next(opts.queryParams);
    }),
    events: of({}),
  };

  const mockJobService = {
    retryJobsByDefinitions: vi.fn().mockReturnValue(of()),
  };

  const mockConfirm = {
    show: vi.fn(),
  };

  const mockBatchService = {
    getCompletedBatches: vi.fn().mockReturnValue(of({ items: [{ id: 'testCompletedId' }] })),
    getActiveBatches: vi.fn().mockReturnValue(of({ items: [{ id: 'testActiveId' }] })),
    deleteMultiple: vi.fn().mockReturnValue(of()),
    deleteMultipleHistoric: vi.fn().mockReturnValue(of()),
    delete: vi.fn().mockReturnValue(of()),
    suspendMultiple: vi.fn().mockReturnValue(of()),
  };

  const mockConfirmActionService = {
    activateOrSuspendBatches: vi.fn().mockReturnValue(of(undefined)),
    retryJobsForBatches: vi.fn().mockReturnValue(of(undefined)),
    deleteBatches: vi.fn().mockReturnValue(of(undefined)),
  };

  const mockToastService = {
    clear: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  };

  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  const buildComponent = (routeOverride?: any) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [],
      declarations: [BatchListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: ConfirmModalService, useValue: mockConfirm },
        { provide: JobService, useValue: mockJobService },
        { provide: ActivatedRoute, useValue: routeOverride ?? mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: BatchService, useValue: mockBatchService },
        { provide: ToastService, useValue: mockToastService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchListComponent);
    component = fixture.componentInstance;
    component.activeItemsTable = mockItemTable;
    component.completedItemsTable = mockCompletedItemTable;

    component.selectedRows = cloneDeep(mockSelected);

    qp$.next({});
    vi.clearAllMocks();
  };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('when there are no query string params', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should load the data with what was saved in local storage', async () => {
      localStorageMock.getItem.mockImplementationOnce((key: string) => {
        expect(key).toBe('batch-list.params');
        return {
          filters: { createUserId: { filter: 'usr1234', type: 'equals' } },
          sorting: [{ colId: 'startTime', sort: 'asc' }],
        };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockBatchService.getActiveBatches).toHaveBeenCalledWith({
        filter: {
          createdBy: 'usr1234',
          sortBy: 'startTime',
          sortOrder: 'asc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockBatchService.getActiveBatches).toHaveBeenCalledWith({
        filter: {
          sortBy: 'startTime',
          sortOrder: 'desc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('when there are query string params', () => {
    it('should use them to load data', async () => {
      buildComponent({
        queryParams: of({
          filters: { suspended: { filterType: 'select', filter: 'active', type: 'equals' } },
          sorting: [{ colId: 'startTime', sort: 'desc' }],
          page: 1,
          pageSize: 50,
        }),
      });
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockBatchService.getActiveBatches).toHaveBeenCalledWith({
        filter: {
          suspended: false,
          sortBy: 'startTime',
          sortOrder: 'desc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('additional tests', () => {
    beforeEach(() => {
      qp$.next({
        sorting: [{ colId: 'startTime', sort: 'desc' }],
        page: 1,
        pageSize: 50,
      });
      buildComponent();
    });

    it('loads the completedBatches list when showCompletedBatches is true', async () => {
      component.showCompletedBatches = true;
      component.sorting = [{ colId: 'startTime', sort: 'desc' }];
      component.reload();

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        queryParams: {
          filters: undefined,
          page: undefined,
          showCompleted: true,
          sorting: '[{"colId":"startTime","sort":"desc"}]',
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('resets the column definitions when resetColumns is called', () => {
      component.resetColumns();

      expect(mockItemTable.resetColumnDefs).toHaveBeenCalled();
      expect(mockCompletedItemTable.resetColumnDefs).toHaveBeenCalled();
    });

    it('should determine if the active batches columns have deviated from the defaults', () => {
      component.showCompletedBatches = false;
      component.columnPrefsUpdated(
        new ListViewState([
          {
            colId: 'batchId',
            width: 330,
            pinned: 'right',
          },
        ]),
      );

      expect(component.hasListViewStateDeviatedFromDefault).toBe(true);

      component.columnPrefsUpdated(
        new ListViewState([
          {
            colId: 'batchId',
            width: 330,
            pinned: 'left',
          },
          {
            colId: 'createUserId',
            width: 150,
            pinned: null,
          },
          {
            colId: 'startTime',
            width: 200,
            pinned: null,
          },
          {
            colId: 'failedJobs',
            width: 110,
            pinned: null,
          },
          {
            colId: 'batchProgress',
            width: 200,
            pinned: null,
          },
          {
            colId: 'suspended',
            width: 150,
            pinned: null,
          },
          {
            colId: 'type',
            width: 420,
            pinned: null,
          },
        ]),
      );

      expect(component.hasListViewStateDeviatedFromDefault).toBe(false);
    });

    it('should determine if the completed batches columns have deviated from the defaults', () => {
      component.showCompletedBatches = true;
      component.columnPrefsUpdated(new ListViewState([]));

      expect(component.hasListViewStateDeviatedFromDefault).toBe(true);

      component.columnPrefsUpdated(
        new ListViewState([
          {
            colId: 'batchId',
            width: 330,
            pinned: 'left',
          },
          {
            colId: 'createUserId',
            width: 150,
            pinned: null,
          },
          {
            colId: 'startTime',
            width: 200,
            pinned: null,
          },
          {
            colId: 'endTime',
            width: 200,
            pinned: null,
          },
          {
            colId: 'executionStartTime',
            width: 170,
            pinned: null,
          },
          {
            colId: 'type',
            width: 510,
            pinned: null,
          },
        ]),
      );

      expect(component.hasListViewStateDeviatedFromDefault).toBe(false);
    });

    it('deletes active batches and jobs when indicated', async () => {
      mockConfirm.show.mockResolvedValue({ confirmed: true, inputs: { cascade: true } });
      await component.delete();

      expect(mockConfirmActionService.deleteBatches).toHaveBeenCalledWith(
        mockSelected.map((row) => row.id),
        false,
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
    });

    it('determines if the toggle button is enabled', () => {
      expect(component.canToggleSuspended()).toBe(true);
      component.selectedRows.forEach((row) => (row.suspended = true));
      expect(component.canToggleSuspended()).toBe(true);
      component.selectedRows[0].suspended = false;
      expect(component.canToggleSuspended()).toBe(false);
    });

    it('deletes historic batches and jobs when indicated', async () => {
      mockConfirm.show.mockResolvedValue({ confirmed: true });
      component.showCompletedBatches = true;
      await component.delete();
      expect(mockConfirmActionService.deleteBatches).toHaveBeenCalledWith(
        mockSelected.map((row) => row.id),
        true,
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
    });

    it('toggles batches to be suspended/activated', async () => {
      await component.toggleSuspended();

      expect(mockConfirmActionService.activateOrSuspendBatches).toHaveBeenCalledWith(
        mockSelected.map((row) => row.id),
        true,
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
    });

    it('always sets batchId on items returned', () => {
      component.loadData();
      expect(component.data).toEqual([{ id: 'testActiveId', batchId: 'testActiveId' }]);
    });

    it('retries selected batches', () => {
      component.retry();
      expect(mockConfirmActionService.retryJobsForBatches).toHaveBeenCalledWith(
        component.selectedRows.map((row) => ({ batchId: row.batchId, batchJobDefinitionId: row.batchJobDefinitionId })),
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
      component.reload();
    });

    it('should show success message when all jobs succeed with multiple jobs', () => {
      component.retry();

      expect(mockConfirmActionService.retryJobsForBatches).toHaveBeenCalledWith(
        component.selectedRows.map((row) => ({ batchId: row.batchId, batchJobDefinitionId: row.batchJobDefinitionId })),
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
    });
  });

  describe('should handle user permissions', () => {
    beforeEach(() => {
      buildComponent();
    });

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
