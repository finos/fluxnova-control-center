import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { GridApi, RowClickedEvent } from 'ag-grid-community';
import { ItemType, ListViewState, ProcessInstance } from '@fxn/types';
import { AgGridAngular } from 'ag-grid-angular';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { AuthorizationHttpService } from '@fxn/common';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { CalledProcessInstancesService } from '../../../services/called-process-instances.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimTab } from '../../item-detail-tab-utils';
import { CalledProcessInstancesTabComponent } from './called-process-instances-tab.component';

describe('StaticCalledProcessInstancesComponent', () => {
  let component: CalledProcessInstancesTabComponent;
  let fixture: ComponentFixture<CalledProcessInstancesTabComponent>;
  let staticCalledProcessInstancesServiceMock: Mocked<CalledProcessInstancesService>;
  let mockGrid: AgGridAngular;

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockRoute = {
    snapshot: {
      queryParams: {},
    },
    queryParams: new BehaviorSubject({}),
    params: of({ id: '123' }),
  };

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockGrid = {
      api: {
        setFilterModel: vi.fn(),
        forEachNode: vi.fn(),
        getColumn: vi.fn(),
        getRenderedNodes: vi.fn(() => []),
        redrawRows: vi.fn(),
      } as unknown as Mocked<GridApi>,
    } as unknown as AgGridAngular;
    staticCalledProcessInstancesServiceMock = {
      getRowDataList: vi.fn(() => of([])),
    } as unknown as Mocked<CalledProcessInstancesService>;

    await TestBed.configureTestingModule({
      declarations: [CalledProcessInstancesTabComponent, ItemsTableComponent],
      providers: [
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        {
          provide: CalledProcessInstancesService,
          useValue: staticCalledProcessInstancesServiceMock,
        },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        ItemDetailPageCommunicationService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CalledProcessInstancesTabComponent);
    component = fixture.componentInstance;
    component.detailItem = { id: '123', type: ItemType.ProcessInstance };
    component.itemTable = { agGrid: mockGrid } as ItemsTableComponent;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoading to false and set rowData on successful data fetch', async () => {
    const cellItems = Array.from({ length: 10 }).map(
      (o, index) =>
        ({
          id: `testId${index}`,
          startTime: `test start time ${index}`,
          endTime: `test end time ${index}`,

          startUserId: `test start user id ${index}`,
          state: 'ACTIVE',
        }) as unknown as ProcessInstance,
    );

    staticCalledProcessInstancesServiceMock.getRowDataList.mockReturnValue(of(cellItems));

    component.init();
    expect(component.isLoading).toBe(true);
    component.eventBus.setDiagramRendered(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual(cellItems);
  });

  it('should set isLoading to false and log error on data fetch failure', async () => {
    staticCalledProcessInstancesServiceMock.getRowDataList.mockReturnValue(throwError(() => new Error('Test Error')));

    component.init();

    await vi.advanceTimersByTimeAsync(1);

    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual([]);
  });

  it('should handle onFilterChanged', async () => {
    await component.onFilterChanged({
      name: {
        filter: 'state',
        type: 'equals',
      },
    });

    expect(staticCalledProcessInstancesServiceMock.getRowDataList).toHaveBeenCalledWith({
      filter: {
        processInstanceId: '123',
        name: 'state',
        sortBy: 'startTime',
        sortOrder: 'desc',
      },
      maxResults: 50,
      firstResult: 0,
    });
  });

  it('should handle onSortChanged', () => {
    component.onSortChanged([{ colId: 'state', sort: 'asc' }]);

    expect(staticCalledProcessInstancesServiceMock.getRowDataList).toHaveBeenCalledWith({
      filter: {
        processInstanceId: '123',
        sortBy: 'state',
        sortOrder: 'asc',
      },
      maxResults: 50,
      firstResult: 0,
    });
  });

  it('should call clear filters when the tab is passed a new itemId', async () => {
    component.filters = { something: { filter: 'abcd', type: 'equals' } };
    component.detailItem = { id: '123', type: ItemType.ProcessInstance };
    await vi.runAllTimersAsync();

    expect(component.filters).toEqual({});
  });

  it('should perform onRowClick correctly', async () => {
    component.init();
    await vi.runAllTimersAsync();
    component.onRowClick({} as RowClickedEvent);
    expect(component.router.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: {
        activityId: undefined,
        tab: 'called-process-instances',
      },
    });

    component.onRowClick({ data: { activityId: 'test-call-activity-id' } } as RowClickedEvent);
    await vi.runAllTimersAsync();
    expect(component.router.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: {
        activityId: 'test-call-activity-id',
        tab: 'called-process-instances',
      },
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessInstance;
    const tab = PimTab.CalledProcessInstances;

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

    it('should load the column preferences from local storage', () => {
      const listView = new ListViewState([{ colId: 'id', pinned: true, width: 330 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', async () => {
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
      expect(component.sorting).toEqual([{ colId: 'startTime', sort: 'desc' }]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
