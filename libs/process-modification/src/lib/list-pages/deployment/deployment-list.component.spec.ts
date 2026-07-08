import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService } from '@fxn/common';
import { ModuleRegistry } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { WINDOW } from 'ngx-window-token';
import { AG_GRID_MODULES } from '@fxn/grid';
import { DeploymentService } from '../../services/deployment.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { DeploymentListComponent } from './deployment-list.component';

ModuleRegistry.registerModules(AG_GRID_MODULES);

describe('DeploymentListPageComponent', () => {
  let component: DeploymentListComponent;
  let fixture: ComponentFixture<DeploymentListComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const qp$ = new BehaviorSubject({});

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockRoute = {
    queryParams: qp$,
  };

  const mockRouter = {
    navigate: vi.fn((arry: [], opts: any) => {
      qp$.next(opts.queryParams);
    }),
    events: of({}),
  };

  const mockTable = {
    resetColumnDefs: vi.fn(),
  } as unknown as Mocked<ItemsTableComponent>;

  const mockConfirmActionService = {
    deleteDeployment: vi.fn().mockReturnValue(of({})),
  };

  const mockDeployment = {
    getDeployments: vi.fn().mockReturnValue(of({ count: 1, items: [{}] })),
  } as any;

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
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: DeploymentService, useValue: mockDeployment },
        { provide: ActivatedRoute, useValue: routeOverride ?? mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: WINDOW, useValue: mockWindow },
      ],
      declarations: [DeploymentListComponent],
    });

    fixture = TestBed.createComponent(DeploymentListComponent);
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
        expect(key).toBe('deployment-list.params');
        return { filters: { name: { filter: 'Test', type: 'contains' } }, sorting: [{ colId: 'name', sort: 'asc' }] };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDeployment.getDeployments).toHaveBeenCalledWith({
        filter: {
          nameLike: '%Test%',
          sortBy: 'name',
          sortOrder: 'asc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDeployment.getDeployments).toHaveBeenCalledWith({
        filter: {
          sortBy: 'deploymentTime',
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
          filters: { name: { filter: 'maker', type: 'contains' } },
          sorting: [{ colId: 'deploymentTime', sort: 'asc' }],
          page: 1,
          pageSize: 50,
        }),
      });
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDeployment.getDeployments).toHaveBeenCalledWith({
        filter: {
          nameLike: '%maker%',
          sortBy: 'deploymentTime',
          sortOrder: 'asc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  it('deletes deployments', async () => {
    buildComponent();

    const mockDeploymentSelection = { id: 'asdf' };
    component.selectedRows = [mockDeploymentSelection];

    component.delete();
    await vi.advanceTimersByTimeAsync(100);

    expect(mockConfirmActionService.deleteDeployment).toHaveBeenCalledWith(['asdf'], expect.any(Function));
  });

  it('updates pagination', async () => {
    buildComponent();
    component.ngOnInit();
    await vi.runAllTimersAsync();
    component.paginationSubject$.next({ page: 1, pageSize: 20 });
    await vi.advanceTimersByTimeAsync(301);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      queryParams: { page: 1, pageSize: 20 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(component.totalCount).toBe(1);
  });

  it('should call resetColumnDefs when reset view is clicked', () => {
    buildComponent();

    component.itemsTable = mockTable;

    component.resetColumns();

    expect(component.itemsTable?.resetColumnDefs).toHaveBeenCalledTimes(1);
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
