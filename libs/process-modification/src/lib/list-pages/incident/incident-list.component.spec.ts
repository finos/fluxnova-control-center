import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService } from '@fxn/common';
import { HasPermissionsDirective } from '@fxn/common/src/lib/general/permissions/has-permissions.directive';
import { Dictionary, GridFilter, GridSort } from '@fxn/types';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { IncidentService } from '../../services/incident.service';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { IncidentListComponent } from './incident-list.component';

describe('IncidentListComponent', () => {
  let component: IncidentListComponent;
  let fixture: ComponentFixture<IncidentListComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockIncidentService: Mocked<IncidentService> = {
    getIncidentsByFilterAndPagination: vi.fn().mockReturnValue(
      of([
        {
          activityId: 'StartEvent_1',
          annotation: null,
          causeIncidentId: '2d90d76e-cd1c-11ef-898e-566736571bf1',
          configuration: '9a40ccef-a768-11ef-acd8-620999cf3742',
          createTime: '2025-01-07T12:23:57.902-0500',
          deleted: false,
          endTime: null,
          executionId: '9a40ccee-a768-11ef-acd8-620999cf3742',
          failedActivityId: 'Activity_0wafbm1',
          historyConfiguration: '2d90141d-cd1c-11ef-898e-566736571bf1',
          id: '2d90d76e-cd1c-11ef-898e-566736571bf1',
          incidentMessage: 'An error occurred while getting response from server',
          incidentType: 'failedJob',
          jobDefinitionId: '930e4d06-a768-11ef-9ad8-965d69b59916',
          open: true,
          processDefinitionId: '930e4d05-a768-11ef-9ad8-965d69b59916',
          processDefinitionKey: 'TestProcessDefinitionKey',
          processInstanceId: '9a40ccee-a768-11ef-acd8-620999cf3742',
          removalTime: null,
          resolved: false,
          rootCauseIncidentId: '2d90d76e-cd1c-11ef-898e-566736571bf1',
          rootProcessInstanceId: '9a40ccee-a768-11ef-acd8-620999cf3742',
          tenantId: null,
        },
      ]),
    ),
    getIncidentCountByFilter: vi.fn().mockReturnValue(of(1)),
  } as unknown as Mocked<IncidentService>;

  const mockConfirmActionService: Mocked<ConfirmActionService> = {
    retryJob: vi.fn((tenantId: string, ids: string[], lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
  } as unknown as Mocked<ConfirmActionService>;

  const mockTable = {
    resetColumnDefs: vi.fn(),
  } as unknown as Mocked<ItemsTableComponent>;

  const qp$ = new BehaviorSubject({});

  const mockRoute = {
    queryParams: qp$,
    snapshot: {
      params: {
        tenant: 'test-tenant-id',
      },
    },
  };

  const mockRouter = {
    navigate: vi.fn((arry: [], opts: any) => {
      qp$.next(opts.queryParams);
    }),
    events: of({}),
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

  const buildComponent = () => {
    TestBed.configureTestingModule({
      declarations: [IncidentListComponent, HasPermissionsDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [NgbTooltip],
      providers: [
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: IncidentService, useValue: mockIncidentService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: Router, useValue: mockRouter },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });
    fixture = TestBed.createComponent(IncidentListComponent);
    component = fixture.componentInstance;

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
        expect(key).toBe('incident-list.params');
        return {
          filters: { incidentMessage: { filter: 'Test', type: 'contains' } },
          sorting: [{ colId: 'createTime', sort: 'desc' }],
        };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledWith({
        filter: { incidentMessageLike: '%Test%', sortBy: 'createTime', sortOrder: 'desc' },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledWith({
        filter: { open: true, sortBy: 'createTime', sortOrder: 'desc' },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('when there are query string params', () => {
    it('should use them to load data', async () => {
      TestBed.overrideProvider(ActivatedRoute, {
        useValue: {
          queryParams: of({
            filters: { status: { filter: 'open', type: 'equals' } },
            sorting: [{ colId: 'activityId', sort: 'asc' }],
            page: 2,
            pageSize: 150,
          }),
        },
      });

      buildComponent();
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledWith({
        filter: { open: true, sortBy: 'activityId', sortOrder: 'asc' },
        firstResult: 150,
        maxResults: 150,
      });
    });
  });

  it('should updateRoute when column filter selected', () => {
    buildComponent();

    const filter: Dictionary<GridFilter | undefined> = {
      incidentMessage: { filter: 'filterTextz', filterType: 'text', type: 'equals' },
    };
    component.selectFilter(filter);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { filters: JSON.stringify(filter) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('should set data and counts correctly on dataLoad', async () => {
    buildComponent();

    component.ngOnInit();
    await vi.runAllTimersAsync();

    expect(component.data).toEqual([
      {
        activityId: 'StartEvent_1',
        annotation: null,
        causeIncidentId: '2d90d76e-cd1c-11ef-898e-566736571bf1',
        configuration: '9a40ccef-a768-11ef-acd8-620999cf3742',
        createTime: '2025-01-07T12:23:57.902-0500',
        deleted: false,
        endTime: null,
        executionId: '9a40ccee-a768-11ef-acd8-620999cf3742',
        failedActivityId: 'Activity_0wafbm1',
        historyConfiguration: '2d90141d-cd1c-11ef-898e-566736571bf1',
        id: '2d90d76e-cd1c-11ef-898e-566736571bf1',
        incidentMessage: 'An error occurred while getting response from server',
        incidentType: 'failedJob',
        jobDefinitionId: '930e4d06-a768-11ef-9ad8-965d69b59916',
        open: true,
        processDefinitionId: '930e4d05-a768-11ef-9ad8-965d69b59916',
        processDefinitionKey: 'TestProcessDefinitionKey',
        processInstanceId: '9a40ccee-a768-11ef-acd8-620999cf3742',
        removalTime: null,
        resolved: false,
        rootCauseIncidentId: '2d90d76e-cd1c-11ef-898e-566736571bf1',
        rootProcessInstanceId: '9a40ccee-a768-11ef-acd8-620999cf3742',
        tenantId: null,
      },
    ]);
    expect(component.totalCount).toEqual(1);
    expect(component.selectedRows).toEqual([]);
    expect(component.isLoading).toEqual(false);
  });

  it('should know if filters or sorting have deviated from base', () => {
    buildComponent();

    expect(
      component.checkHasFilterOrSortDeviated(
        { status: { filterType: 'select', filter: 'open', type: 'equals' } },
        [{ colId: 'createTime', sort: 'desc' }],
        '',
      ),
    ).toEqual(false);
    expect(
      component.checkHasFilterOrSortDeviated(
        { state: { filterType: 'select', filter: 'open', type: 'equals' } },
        [{ colId: 'createTime', sort: 'asc' }],
        '',
      ),
    ).toEqual(true);
    expect(
      component.checkHasFilterOrSortDeviated(
        {},
        [
          {
            colId: 'createTime',
            sort: 'desc',
          },
        ],
        '',
      ),
    ).toEqual(true);
    expect(
      component.checkHasFilterOrSortDeviated(
        { state: { filterType: 'select', filter: 'open', type: 'equals' } },
        [{ colId: 'createTime', sort: 'desc' }],
        '',
      ),
    ).toEqual(true);
  });

  it('should updateRoute when column sort selected', () => {
    buildComponent();

    const sorting: GridSort[] = [{ colId: 'processInstanceId', sort: 'asc' }];
    component.selectHeaderSort(sorting);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { sorting: JSON.stringify(sorting) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  describe('on increment retry button click', () => {
    beforeEach(() => {
      buildComponent();

      component.selectedRows = [
        { incidentMessage: 'Problem occurred.', id: '1234', configuration: '1234', processDefinitionKey: 'defKey' },
      ];
    });

    it('should update job retries', async () => {
      component.retry();
      await vi.runAllTimersAsync();

      expect(mockConfirmActionService.retryJob).toHaveBeenCalledWith(
        mockRoute.snapshot.params.tenant,
        ['1234'],
        [{ incidentMessage: 'Problem occurred.', id: '1234', configuration: '1234', processDefinitionKey: 'defKey' }],
        expect.any(Function),
      );
    });

    it('should reload the list', async () => {
      component.retry();
      await vi.runAllTimersAsync();

      expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledTimes(1);
    });
  });

  describe('When resetting grid', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should call router navigate when resetting columns', () => {
      component.itemsTable = mockTable;
      component.resetColumns();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should call resetColumnDefs when reset view is clicked', () => {
      component.itemsTable = mockTable;

      component.resetColumns();

      expect(component.itemsTable?.resetColumnDefs).toHaveBeenCalledTimes(1);
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
