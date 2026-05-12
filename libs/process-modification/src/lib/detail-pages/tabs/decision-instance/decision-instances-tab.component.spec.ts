import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RowClickedEvent } from 'ag-grid-community';
import { Dictionary, ItemType, ListViewState } from '@fxn/types';
import { AgGridAngular } from 'ag-grid-angular';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { mapQueryParamsOptions } from '../../../services/service-utils';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { PimTab } from '../../item-detail-tab-utils';
import { DecisionInstancesTabComponent } from './decision-instances-tab.component';

describe('DecisionInstanceTabComponent', () => {
  const buildComponent = () => {
    fixture = TestBed.createComponent(DecisionInstancesTabComponent);
    component = fixture.componentInstance;
    component.detailItem = { id: '123', type: ItemType.DecisionDefinition };
    fixture.detectChanges();
  };

  const mockDecisionInstanceService: Mocked<DecisionInstanceService> = {
    getDecisionInstanceList: vi.fn(() => of([])),
    getCleanedParams: vi.fn((params: Dictionary<any>) =>
      mapQueryParamsOptions({
        queryParams: params,
        itemType: ItemType.DecisionInstance,
      }),
    ),
  } as unknown as Mocked<DecisionInstanceService>;

  let component: DecisionInstancesTabComponent;
  let fixture: ComponentFixture<DecisionInstancesTabComponent>;
  const selectedItemId = 'testDecisionInstanceId-1';
  const testActivityId = 'testActivityId';

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

  const mockHttp = { get: vi.fn(() => ({ pipe: vi.fn() })) } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DecisionInstancesTabComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: DecisionInstanceService,
          useValue: mockDecisionInstanceService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  describe('When the list first loads', () => {
    beforeEach(() => {
      buildComponent();
      component.itemTable = {
        agGrid: {
          api: {
            setFilterModel: vi.fn(),
            forEachNode: vi.fn(),
            getSelectedRows: vi.fn(() => [{ id: selectedItemId, activityId: testActivityId }]),
            getRenderedNodes: vi.fn(),
            redrawRows: vi.fn(),
          },
        } as unknown as AgGridAngular,
      } as ItemsTableComponent;
      vi.clearAllMocks();
    });

    it('should get data based on parentItemType correctly', async () => {
      component.parentItemType = ItemType.ProcessInstance;
      component.init();
      await vi.runAllTimersAsync();

      expect(component.decisionInstanceService.getDecisionInstanceList).toHaveBeenCalledWith({
        filter: {
          processInstanceId: '123',
          sortBy: 'evaluationTime',
          sortOrder: 'desc',
        },
        maxResults: 50,
        firstResult: 0,
      });

      component.parentItemType = ItemType.ProcessDefinition;
      component.init();
      await vi.runAllTimersAsync();

      expect(component.decisionInstanceService.getDecisionInstanceList).toHaveBeenCalledWith({
        filter: {
          processInstanceId: '123',
          sortBy: 'evaluationTime',
          sortOrder: 'desc',
        },
        maxResults: 50,
        firstResult: 0,
      });

      component.parentItemType = ItemType.DecisionDefinition;
      component.init();
      await vi.runAllTimersAsync();

      expect(component.decisionInstanceService.getDecisionInstanceList).toHaveBeenCalledWith({
        filter: {
          processInstanceId: '123',
          sortBy: 'evaluationTime',
          sortOrder: 'desc',
        },
        maxResults: 50,
        firstResult: 0,
      });
      setTimeout(() => {
        expect(component.isLoading).toBe(false);
      }, 0);
    });

    it('should get filters from grid event', async () => {
      await component.onFilterChanged({
        id: {
          filter: '1234',
          type: 'equals',
        },
      });

      expect(component.decisionInstanceService.getDecisionInstanceList).toHaveBeenCalledWith({
        filter: {
          decisionDefinitionId: '123',
          decisionInstanceId: '1234',
          sortBy: 'evaluationTime',
          sortOrder: 'desc',
        },
        maxResults: 50,
        firstResult: 0,
      });
    });

    it('should get sorting from grid event', () => {
      component.onSortChanged([{ sort: 'asc', colId: 'evaluationTime' }]);

      expect(component.decisionInstanceService.getDecisionInstanceList).toHaveBeenCalledWith({
        filter: {
          decisionDefinitionId: '123',
          sortBy: 'evaluationTime',
          sortOrder: 'asc',
        },
        maxResults: 50,
        firstResult: 0,
      });
    });

    it('should update the url with the activityId when a row is clicked', () => {
      component.onRowClick({ data: { activityId: testActivityId } } as RowClickedEvent);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        replaceUrl: true,
        queryParams: { tab: 'decision-instances', activityId: testActivityId },
      });
    });

    it('should not update the url with the activityId if selectedRows is undefined', () => {
      component.itemTable = {
        agGrid: {
          api: {
            setFilterModel: vi.fn(),
            forEachNode: vi.fn(),
            getSelectedRows: vi.fn(() => undefined),
          },
        } as unknown as AgGridAngular,
      } as ItemsTableComponent;

      component.onRowClick({} as RowClickedEvent);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        replaceUrl: true,
        queryParams: { tab: 'decision-instances' },
      });
    });

    it('should replace activityId with activityIdIn as array in dataFilter', () => {
      const activityIdValue = 'some-activity-id';
      vi.spyOn(component, 'userSuppliedFilters', 'get').mockReturnValue({
        activityId: activityIdValue,
        foo: 'bar',
      });

      component.detailItem = { id: 'detail-123', type: ItemType.DecisionDefinition };

      const result = component.dataFilter;

      expect(result).toHaveProperty('activityIdIn');
      expect(result.activityIdIn).toEqual([activityIdValue]);
      expect(result).not.toHaveProperty('activityId');
      expect(result.foo).toBe('bar');
      expect(result[component.getParentItemKeyName()]).toBe('detail-123');
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.DecisionDefinition;
    const tab = PimTab.DecisionInstances;

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
      buildComponent();
      component.init();
      const resetUrlSpy = vi.spyOn(component, 'resetUrl');
      const mockItemTable = { resetColumnDefs: vi.fn() };
      component.itemTable = mockItemTable as unknown as ItemsTableComponent;
      component.onFilterChanged({ testFilter: 'test-value' });
      component.onSortChanged([{ sort: 'asc', colId: 'version' }]);

      component.onResetGridClick();

      expect(component.filters).toEqual({});
      expect(component.sorting).toEqual([{ colId: 'evaluationTime', sort: 'desc' }]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
