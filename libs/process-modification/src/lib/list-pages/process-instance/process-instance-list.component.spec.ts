import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Dictionary,
  GridFilter,
  GridSort,
  processInstanceListToggleFilters,
  ProcessInstanceStatesMap,
} from '@fxn/types';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService } from '@fxn/common';
import { HasPermissionsDirective } from '@fxn/common/src/lib/general/permissions/has-permissions.directive';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { BatchService } from '../../services/support/batch.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { ProcessInstanceListComponent } from './process-instance-list.component';

const mockBatchService = {};

describe('ProcessInstanceListComponent', () => {
  let component: ProcessInstanceListComponent;
  let fixture: ComponentFixture<ProcessInstanceListComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockTable = {
    resetColumnDefs: vi.fn(),
  } as unknown as Mocked<ItemsTableComponent>;

  const qp$ = new BehaviorSubject({});

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockRoute = {
    snapshot: { params: { tenant: 'test-tenant-id' } },
    queryParams: qp$,
  };

  const mockRouter = {
    navigate: vi.fn((arry: [], opts: any) => {
      qp$.next(opts.queryParams);
    }),
    events: of({}),
  };

  const mockInstanceService = {
    suspendOrActivate: vi.fn().mockReturnValue(of({})),
    terminate: vi.fn().mockReturnValue(of({})),
    getProcessInstancesByFilter: vi.fn().mockReturnValue(
      of([
        {
          id: 'bbe6785b-be27-11ef-84d1-c2d8766cbcd4',
          businessKey: 'postfix-56',
          processDefinitionId: 'b9db8d21-be27-11ef-84d1-c2d8766cbcd4',
          processDefinitionKey: 'ids-regression-child-model',
          processDefinitionName: 'ids-regression-child-model',
          processDefinitionVersion: 2,
          startTime: '2024-12-19T11:38:53.722-0500',
          endTime: null,
          removalTime: null,
          durationInMillis: null,
          startUserId: 'fluxnovaTestUser',
          startActivityId: 'Start',
          deleteReason: null,
          rootProcessInstanceId: 'bbe6785b-be27-11ef-84d1-c2d8766cbcd4',
          superProcessInstanceId: null,
          superCaseInstanceId: null,
          caseInstanceId: null,
          tenantId: null,
          state: 'ACTIVE',
          restartedProcessInstanceId: null,
        },
      ]),
    ),
    getProcessInstanceHistoryCountByFilter: vi.fn().mockReturnValue(of(1)),
  };

  const mockConfirmActionService = {
    suspendOrActivateInstance: vi.fn().mockReturnValue(of({})),
    terminateInstance: vi.fn().mockReturnValue(of({})),
  } as unknown as Mocked<ConfirmActionService>;

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
      imports: [NgbModule],
      declarations: [ProcessInstanceListComponent, HasPermissionsDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: BatchService, useValue: mockBatchService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ProcessInstanceService, useValue: mockInstanceService },
        { provide: Router, useValue: mockRouter },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });

    fixture = TestBed.createComponent(ProcessInstanceListComponent);
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
        expect(key).toBe('processinstance-list.params');
        return { filters: { name: { filter: 'Test', type: 'contains' } }, sorting: [{ colId: 'name', sort: 'asc' }] };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledWith({
        filter: { name: '%Test%', sorting: [{ sortBy: 'name', sortOrder: 'asc' }] },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledWith({
        filter: { active: true, sorting: [{ sortBy: 'startTime', sortOrder: 'desc' }] },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  it('should updateRoute when toggle filter selected', () => {
    buildComponent();

    component.toggleFilters = processInstanceListToggleFilters;
    component.selectToggleFilter(component.toggleFilters[0]);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { toggleFilters: processInstanceListToggleFilters[0].field },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('should updateRoute when column filter selected', () => {
    buildComponent();

    const filter: Dictionary<GridFilter | undefined> = {
      processDefinitionName: { filter: 'filterText', filterType: 'text', type: 'equals' },
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
        id: 'bbe6785b-be27-11ef-84d1-c2d8766cbcd4',
        businessKey: 'postfix-56',
        processDefinitionId: 'b9db8d21-be27-11ef-84d1-c2d8766cbcd4',
        processDefinitionKey: 'ids-regression-child-model',
        processDefinitionName: 'ids-regression-child-model',
        processDefinitionVersion: 2,
        startTime: '2024-12-19T11:38:53.722-0500',
        endTime: null,
        removalTime: null,
        durationInMillis: null,
        startUserId: 'fluxnovaTestUser',
        startActivityId: 'Start',
        deleteReason: null,
        rootProcessInstanceId: 'bbe6785b-be27-11ef-84d1-c2d8766cbcd4',
        superProcessInstanceId: null,
        superCaseInstanceId: null,
        caseInstanceId: null,
        tenantId: null,
        state: 'ACTIVE',
        restartedProcessInstanceId: null,
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
        { state: { filterType: 'select', filter: 'active', type: 'equals' } },
        [{ colId: 'startTime', sort: 'desc' }],
        '',
      ),
    ).toEqual(false);
    expect(
      component.checkHasFilterOrSortDeviated(
        { state: { filterType: 'select', filter: 'active', type: 'equals' } },
        [{ colId: 'startTime', sort: 'asc' }],
        '',
      ),
    ).toEqual(true);
    expect(component.checkHasFilterOrSortDeviated({}, [{ colId: 'startTime', sort: 'desc' }], '')).toEqual(true);
    expect(
      component.checkHasFilterOrSortDeviated(
        { state: { filterType: 'select', filter: 'active', type: 'equals' } },
        [{ colId: 'startTime', sort: 'desc' }],
        'withIncidents',
      ),
    ).toEqual(true);
  });

  it('should updateRoute when column sort selected', () => {
    buildComponent();

    const sorting: GridSort[] = [{ colId: 'id', sort: 'asc' }];
    component.selectHeaderSort(sorting);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { sorting: JSON.stringify(sorting) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  describe('on suspend button click', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should call suspendOrActivateInstance', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      component.suspendOrActivate(true);

      expect(mockConfirmActionService.suspendOrActivateInstance).toHaveBeenCalledWith(
        mockRoute.snapshot.params.tenant,
        ['1234'],
        true,
      );
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() =>
        Promise.resolve(of({ canceled: true })),
      );

      await component.suspendOrActivate(true);

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => Promise.resolve(of(null)));

      await component.suspendOrActivate(true);

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('on activate button click', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should call suspendOrActivateInstance', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      component.suspendOrActivate(false);

      expect(mockConfirmActionService.suspendOrActivateInstance).toHaveBeenCalledWith(
        mockRoute.snapshot.params.tenant,
        ['1234'],
        false,
      );
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() =>
        Promise.resolve(of({ canceled: true })),
      );

      await component.suspendOrActivate(false);

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => Promise.resolve(of(null)));

      await component.suspendOrActivate(false);

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('on terminate button click', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should call terminate', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      component.terminate();

      expect(mockConfirmActionService.terminateInstance).toHaveBeenCalledWith(mockRoute.snapshot.params.tenant, [
        '1234',
      ]);
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234' }];

      mockConfirmActionService.terminateInstance.mockImplementation(() => Promise.resolve(of({ canceled: true })));

      await component.terminate();

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Instance', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.terminateInstance.mockImplementation(() => Promise.resolve(of(null)));

      await component.terminate();

      expect(mockInstanceService.getProcessInstancesByFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bulk Actions', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('indicates when selected instances can be suspended', () => {
      component.selectedRows = [{ state: ProcessInstanceStatesMap.ACTIVE.value }];
      expect(component.canSuspend()).toBe(true);
      component.selectedRows = [
        { state: ProcessInstanceStatesMap.ACTIVE.value },
        { state: ProcessInstanceStatesMap.SUSPENDED.value },
      ];
      expect(component.canSuspend()).toBe(false);
    });

    it('indicates when selected instances can be resumed', () => {
      component.selectedRows = [{ state: ProcessInstanceStatesMap.SUSPENDED.value }];
      expect(component.canActivate()).toBe(true);
      component.selectedRows = [
        { state: ProcessInstanceStatesMap.SUSPENDED.value },
        { state: ProcessInstanceStatesMap.COMPLETED.value },
      ];
      expect(component.canActivate()).toBe(false);
    });

    it('indicates when selected instances can be terminated', () => {
      component.selectedRows = [
        { state: ProcessInstanceStatesMap.ACTIVE.value },
        { state: ProcessInstanceStatesMap.SUSPENDED.value },
      ];
      expect(component.canTerminate()).toBe(true);
      component.selectedRows = [
        { state: ProcessInstanceStatesMap.ACTIVE.value },
        { state: ProcessInstanceStatesMap.SUSPENDED.value },
        { state: ProcessInstanceStatesMap.COMPLETED.value },
      ];
      expect(component.canTerminate()).toBe(false);
      component.selectedRows = [
        { state: ProcessInstanceStatesMap.ACTIVE.value },
        { state: ProcessInstanceStatesMap.SUSPENDED.value },
        { state: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.value },
      ];
      expect(component.canTerminate()).toBe(false);
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
