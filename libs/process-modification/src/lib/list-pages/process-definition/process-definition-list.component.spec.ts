import { BehaviorSubject, of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListViewState } from '@fxn/types';
import { AuthorizationHttpService } from '@fxn/common';
import { HasPermissionsDirective } from '@fxn/common/src/lib/general/permissions/has-permissions.directive';
import { afterEach, beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { ProcessDefinitionService } from '../../services/process-definition.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { ProcessDefinitionListComponent } from './process-definition-list.component';

describe('ProcessDefinitionListComponent', () => {
  let component: ProcessDefinitionListComponent;
  let fixture: ComponentFixture<ProcessDefinitionListComponent>;
  let loadDataSpy: Mock<typeof component.loadData>;
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
    activateOrSuspendDefinition: vi.fn(),
    deleteDefinition: vi.fn(),
  } as unknown as Mocked<ConfirmActionService>;

  const mockDefinitionService = {
    deleteDefinition: vi.fn().mockReturnValue(of({})),
    getProcessDefinitionsByFilter: vi.fn().mockReturnValue(of([])),
    getProcessDefinitionCountByFilter: vi.fn().mockReturnValue(of(0)),
  };

  const localStorageMock = {
    getItem: vi.fn((key: string): any => {
      if (key === 'processdefinition-list.listviewstate')
        return { columnState: [{ colId: 'id', pinned: true, width: 330 }], differentThanDefaults: true };

      return undefined;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  const buildComponent = () => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      declarations: [ProcessDefinitionListComponent, HasPermissionsDirective],
      imports: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClientTesting(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });
    fixture = TestBed.createComponent(ProcessDefinitionListComponent);
    component = fixture.componentInstance;

    qp$.next({});

    loadDataSpy = vi.spyOn(component, 'loadData');
  };

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => vi.useRealTimers());

  describe('when there are no query string params', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should load the data with what was saved in local storage', async () => {
      localStorageMock.getItem.mockImplementationOnce((key: string) => {
        expect(key).toBe('processdefinition-list.params');
        return { filters: { name: { filter: 'Test', type: 'contains' } }, sorting: [{ colId: 'name', sort: 'asc' }] };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDefinitionService.getProcessDefinitionsByFilter).toHaveBeenCalledWith({
        filter: { nameLike: '%Test%', sortBy: 'name', sortOrder: 'asc' },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDefinitionService.getProcessDefinitionsByFilter).toHaveBeenCalledWith({
        filter: { active: true, latestVersion: true, sortBy: 'name', sortOrder: 'asc' },
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
            filters: { suspended: { filterType: 'select', filter: 'active', type: 'equals' } },
            sorting: [{ colId: 'version', sort: 'desc' }],
            page: 1,
            pageSize: 50,
            toggleFilters: 'latestVersion',
          }),
        },
      });

      buildComponent();
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockDefinitionService.getProcessDefinitionsByFilter).toHaveBeenCalledWith({
        filter: { latestVersion: true, active: true, sortBy: 'version', sortOrder: 'desc' },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  it('should call resetColumnDefs when reset view is clicked', () => {
    component.itemsTable = mockTable;

    component.resetColumns();

    expect(component.itemsTable?.resetColumnDefs).toHaveBeenCalledTimes(1);
  });

  it('should load the column preferences from local storage', () => {
    const listView = new ListViewState([{ colId: 'id', pinned: true, width: 330 }]);

    fixture.detectChanges();

    expect(localStorageMock.getItem).toHaveBeenCalledWith('processdefinition-list.listviewstate');
    expect(component.listViewState.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
  });

  it('should save the column preferences to local storage', () => {
    const listView = new ListViewState([{ colId: 'id', pinned: false, width: 330 }]);

    vi.clearAllMocks();

    component.columnPrefsUpdated(listView);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'processdefinition-list.listviewstate',
      JSON.stringify({ columnState: listView.getColumnStates(), differentThanDefaults: true }),
    );
  });

  describe('on suspend button click', () => {
    beforeEach(() => {
      buildComponent();
      vi.clearAllMocks();
    });

    it('should call delete', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      component.suspend();

      expect(mockConfirmActionService.activateOrSuspendDefinition).toHaveBeenCalledWith(
        ['1234'],
        'Suspend',
        expect.any(Function),
      );
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      mockConfirmActionService.activateOrSuspendDefinition.mockImplementation(() =>
        Promise.resolve(of({ canceled: true })),
      );

      await component.suspend();

      expect(loadDataSpy).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.activateOrSuspendDefinition.mockImplementation((ids, action, successCallback) => {
        successCallback();
        return Promise.resolve(of(null)); // Returning the observable
      });

      await component.suspend();

      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  describe('on activate button click', () => {
    beforeEach(() => {
      buildComponent();
      vi.clearAllMocks();
    });

    it('should call activateDefinition', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      component.activate();

      expect(mockConfirmActionService.activateOrSuspendDefinition).toHaveBeenCalledWith(
        ['1234'],
        'Activate',
        expect.any(Function),
      );
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      mockConfirmActionService.activateOrSuspendDefinition.mockImplementation(() =>
        Promise.resolve(of({ canceled: true })),
      );

      await component.activate();

      expect(loadDataSpy).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.activateOrSuspendDefinition.mockImplementation((ids, action, successCallback) => {
        successCallback();
        return Promise.resolve(of(null)); // Returning the observable
      });

      await component.activate();

      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  describe('on delete button click', () => {
    beforeEach(() => {
      buildComponent();
      vi.clearAllMocks();
    });

    it('should call delete', () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      component.delete();

      expect(mockConfirmActionService.deleteDefinition).toHaveBeenCalledWith(['1234'], expect.any(Function));
    });

    it('should do nothing when the action is canceled', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234' }];

      mockConfirmActionService.deleteDefinition.mockImplementation(() => Promise.resolve(of({ canceled: true })));

      await component.delete();

      expect(loadDataSpy).toHaveBeenCalledTimes(0);
    });

    it('should reload the list', async () => {
      component.selectedRows = [{ processDefinitionName: 'Process Definition', id: '1234', key: 'imAKey' }];

      mockConfirmActionService.deleteDefinition.mockImplementation((ids, successCallback) => {
        successCallback();
        return Promise.resolve(of(null)); // Returning the observable
      });

      await component.delete();

      expect(loadDataSpy).toHaveBeenCalled();
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
