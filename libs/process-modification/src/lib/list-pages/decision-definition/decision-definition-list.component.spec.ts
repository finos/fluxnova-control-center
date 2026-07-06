import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { ModuleRegistry } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { AuthorizationHttpService } from '@fxn/common';
import { AG_GRID_MODULES } from '@fxn/grid';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { DecisionDefinitionService } from '../../services/decision-definition.service';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { DecisionDefinitionListComponent } from './decision-definition-list.component';

ModuleRegistry.registerModules(AG_GRID_MODULES);

describe('DecisionDefinitionListComponent', () => {
  let component: DecisionDefinitionListComponent;
  let fixture: ComponentFixture<DecisionDefinitionListComponent>;

  const qp$ = new BehaviorSubject({});

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

  const mockDecisionDefinitionService = {
    getDecisionDefinitions: vi.fn().mockReturnValue(of({ count: 1, items: [{}] })),
  } as any;

  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  const buildComponent = (routeOverride?: any) => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [DecisionDefinitionListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeOverride ?? mockRoute },
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: Router, useValue: mockRouter },
        { provide: DecisionDefinitionService, useValue: mockDecisionDefinitionService },
        { provide: ConfirmActionService, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(DecisionDefinitionListComponent);
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
        expect(key).toBe('decisiondefinition-list.params');
        return {
          filters: { name: { filter: 'Test', type: 'contains' } },
          sorting: [{ colId: 'name', sort: 'asc' }],
        };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDecisionDefinitionService.getDecisionDefinitions).toHaveBeenCalledWith({
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

      expect(mockDecisionDefinitionService.getDecisionDefinitions).toHaveBeenCalledWith({
        filter: {
          latestVersion: true,
          sortBy: 'key',
          sortOrder: 'asc',
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
          filters: { key: { filter: 'Auto', type: 'contains' } },
          sorting: [{ colId: 'key', sort: 'desc' }],
          page: 1,
          pageSize: 50,
        }),
      });
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDecisionDefinitionService.getDecisionDefinitions).toHaveBeenCalledWith({
        filter: {
          keyLike: '%Auto%',
          sortBy: 'key',
          sortOrder: 'desc',
        },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  it('should unsubscribe on destroy', () => {
    buildComponent();

    component.ngOnInit();

    const unsubscribeSpy = vi.spyOn(component['subs'], 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('updates pagination', async () => {
    buildComponent();
    fixture.detectChanges();
    await vi.runAllTimersAsync();

    component.paginationSubject$.next({ page: 1, pageSize: 20 });

    await vi.advanceTimersByTimeAsync(1001);

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
});
