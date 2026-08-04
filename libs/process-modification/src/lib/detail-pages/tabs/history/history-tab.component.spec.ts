import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { IsFullWidthRowParams, RowClickedEvent } from 'ag-grid-community';
import { AuthorizationHttpService, ToastService } from '@fxn/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ItemType, ListViewState, ProcessInstanceFullHistory } from '@fxn/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { PimTab } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { HistoryTabComponent } from './history-tab.component';

describe('ItemDetailHistorySectionComponent', () => {
  let component: HistoryTabComponent;
  let fixture: ComponentFixture<HistoryTabComponent>;
  const mockModalComponent = { title: '' };
  const mockRouter = {
    navigate: vi.fn(),
  };
  const mockModal = {
    open: vi.fn().mockReturnValue({ componentInstance: mockModalComponent }),
  };
  const detailItemId = 'test-detailItemId';
  const historyId1 = 'test-historyId1';
  const activityId = 'test-activityId';

  const mockRoute = {
    queryParams: of({
      historyId: historyId1,
      activityId,
    }),
    snapshot: {
      queryParams: {},
    },
  } as unknown as ActivatedRoute;

  const mockProcessInstanceService = {
    getFullHistory: vi.fn(() =>
      of({
        activityInstance: [],
        detail: [],
        incident: [],
        userOperation: [],
      } as ProcessInstanceFullHistory),
    ),
  } as unknown as ProcessInstanceService;

  const mockToastService = {
    error: vi.fn(),
  } as unknown as ToastService;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [HistoryTabComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockRoute,
        },
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        ItemDetailPageCommunicationService,
        {
          provide: ProcessInstanceService,
          useValue: mockProcessInstanceService,
        },
        { provide: Router, useValue: mockRouter },
        { provide: NgbModal, useValue: mockModal },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    fixture = TestBed.createComponent(HistoryTabComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should set history ID on options set', async () => {
    component.detailItem = { id: detailItemId, type: ItemType.ProcessInstance };
    await vi.runAllTimersAsync();

    expect(component.selectedItemId).toEqual(historyId1);
  });

  it('should navigate with correct activityId on history row selected', async () => {
    await component.onRowClick({ data: { activityId: 'activity123' } } as RowClickedEvent);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { tab: PimTab.History, activityId: 'activity123' },
    });
  });

  it('should have correct overlayNorRowsTemplate string value with phrase "No history items were found"', () => {
    expect(component.overlayNoRowsTemplate).toMatchSnapshot();
  });

  describe('onRowClick', () => {
    it('should have isLoadAll as true when row clicked is loadAllButton row', () => {
      component.onRowClick({
        data: {
          id: 'loadAllButton',
        },
      } as RowClickedEvent);

      expect(component.isLoadAll).toBe(true);
    });

    it('should have isLoadAll as false when row clicked is NOT loadAllButton row', () => {
      component.onRowClick({
        data: {},
      } as RowClickedEvent);

      expect(component.isLoadAll).toBe(false);
    });
  });

  describe('dataService', () => {
    it('should return observable with empty array', async () => {
      const response = await firstValueFrom(component.dataService(new PaginatedDataRequest({})));
      expect(response).toEqual([]);
    });

    it(
      'should show toast message and return observable with empty array when ' +
        'processInstanceService.getFullHistory throws an error',
      async () => {
        const spyGetFullHistory = vi.spyOn(mockProcessInstanceService, 'getFullHistory');
        const errorMessage = 'error message';
        spyGetFullHistory.mockImplementationOnce(() => throwError(() => new Error(errorMessage)));

        const response = await firstValueFrom(component.dataService(new PaginatedDataRequest({})));
        expect(mockToastService.error).toHaveBeenCalledWith(errorMessage);
        expect(response).toEqual([]);
      },
    );
  });

  describe('isFullWidthRow', () => {
    it('should return false', () => {
      const params = {
        rowNode: {
          data: {
            id: 'testId',
          },
        },
      } as IsFullWidthRowParams;

      expect(component.isFullWidthRow(params)).toBe(false);
    });

    it('should return true', () => {
      const params = {
        rowNode: {
          data: {
            id: 'loadAllButton',
          },
        },
      } as IsFullWidthRowParams;

      expect(component.isFullWidthRow(params)).toBe(true);
    });
  });

  describe('on filter changed', () => {
    it('should call loadData', async () => {
      const spyOnLoadData = vi.spyOn(component, 'loadData');

      await component.onFilterChanged({});

      expect(spyOnLoadData).toHaveBeenCalled();
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessInstance;
    const tab = PimTab.History;

    const storageKey = `${itemType}-detail-tab-${tab}.listviewstate`.toLowerCase();
    const localStorageMock = {
      getItem: vi.fn((key: string): any => {
        if (key === storageKey)
          return { columnState: [{ colId: 'startTime', pinned: true, width: 330 }], differentThanDefaults: true };

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
      const listView = new ListViewState([{ colId: 'startTime', pinned: true, width: 330 }]);

      fixture.detectChanges();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(component.listViewState?.getColumnStates()).toContainEqual(listView.getColumnStates()[0]);
    });

    it('should save the column preferences to local storage', () => {
      const listView = new ListViewState([{ colId: 'startTime', pinned: false, width: 330 }]);

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
