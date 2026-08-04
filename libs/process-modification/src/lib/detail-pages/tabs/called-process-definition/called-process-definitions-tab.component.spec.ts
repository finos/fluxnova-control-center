import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { RowClickedEvent } from 'ag-grid-community';
import { CalledProcessDefinition, ItemType, ListViewState } from '@fxn/types';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationHttpService } from '@fxn/common';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { BaseTabComponent } from '../base-tab-component';
import { PimTab } from '../../item-detail-tab-utils';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { CalledProcessDefinitionsTabComponent } from './called-process-definitions-tab.component';

describe('StaticCalledProcessDefinitionsTabComponent', () => {
  let component: CalledProcessDefinitionsTabComponent;
  let fixture: ComponentFixture<CalledProcessDefinitionsTabComponent>;
  let mockProcessDefinitionService: ProcessDefinitionService;
  let route: ActivatedRoute;
  let mockRouter: Router;
  const mockProcessDefinitionsList: CalledProcessDefinition[] = [
    {
      calledFromActivityIds: ['test-call-activity-Id'],
      id: 'testId',
      name: 'testName',
      state: 'Running and referenced',
      calledFromActivityId: 'test-call-activity-id',
    },
  ];
  beforeEach(async () => {
    route = {
      params: of({ id: '123' }),
      queryParams: of({ id: '123' }),
      snapshot: {
        queryParams: {},
      },
    } as any;
    mockRouter = { navigate: vi.fn() } as unknown as Router;

    mockProcessDefinitionService = {
      getCalledProcessDefinitions: vi.fn(() => of(mockProcessDefinitionsList)),
    } as unknown as ProcessDefinitionService;

    const mockAuthHttpService = {
      checkSync: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClientTesting(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ProcessDefinitionService, useValue: mockProcessDefinitionService },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: mockRouter },
        HttpClient,
      ],
    });

    fixture = TestBed.createComponent(CalledProcessDefinitionsTabComponent);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should have correct column definitions', () => {
    expect(component.columnDefinitions).toMatchSnapshot();
  });

  it('should have correct overlayNoRowsTemplate getter', () => {
    expect(component.overlayNoRowsTemplate).toMatchSnapshot();
  });

  it('should load data', async () => {
    const result = await firstValueFrom(
      component.dataService(new PaginatedDataRequest({ processDefinitionId: 'test-process-definition-id' })),
    );

    expect(result).toEqual(mockProcessDefinitionsList);
  });

  it('should navigate with correct queryParams after a row click', async () => {
    component.init();
    await vi.runAllTimersAsync();
    component.onRowClick({} as RowClickedEvent);
    expect(component.router.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: {
        tab: 'called-process-definitions',
        activityId: undefined,
        filteredActivityId: undefined,
        [component.rowItemQueryParam]: undefined,
      },
    });
    component.onRowClick({ data: { activityId: 'test-call-activity-id' } } as RowClickedEvent);
    await vi.runAllTimersAsync();
    expect(component.router.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: {
        tab: 'called-process-definitions',
        activityId: 'test-call-activity-id',
      },
    });
  });

  it('should call super.selectRow with correct property param', () => {
    const selectRowSpy = vi.spyOn(BaseTabComponent.prototype, 'selectRow');
    component.selectRow('123');
    expect(selectRowSpy).toHaveBeenCalledWith('123', 'calledProcessDefinitionId');
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessDefinition;
    const tab = PimTab.CalledProcessDefinitions;

    const storageKey = `${itemType}-detail-tab-${tab}.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return { columnState: [{ colId: 'state', pinned: true, width: 330 }], differentThanDefaults: true };

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
      const listView = new ListViewState([{ colId: 'state', pinned: true, width: 330 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', async () => {
      const listView = new ListViewState([{ colId: 'state', pinned: false, width: 330 }]);

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
      expect(component.sorting).toEqual([]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
