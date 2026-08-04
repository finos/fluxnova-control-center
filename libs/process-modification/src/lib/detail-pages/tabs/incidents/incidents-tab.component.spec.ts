import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { RowClickedEvent } from 'ag-grid-community';
import { ItemType, ListViewState } from '@fxn/types';
import { AuthorizationHttpService, PermissionService } from '@fxn/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { IncidentService } from '../../../services/incident.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { PimTab } from '../../item-detail-tab-utils';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { IncidentsTabComponent } from './incidents-tab.component';

describe('ItemDetailIncidentSectionComponent', () => {
  let component: IncidentsTabComponent;
  let fixture: ComponentFixture<IncidentsTabComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const itemTypeListWithIncidentsTab = [ItemType.ProcessDefinition, ItemType.ProcessInstance];

  itemTypeListWithIncidentsTab.forEach((itemTypeForRouteData) => {
    describe(`when itemType is ${itemTypeForRouteData}`, () => {
      const mockRouter = {
        navigate: vi.fn(),
      };

      const mockActivatedRoute = {
        data: of({
          itemType: itemTypeForRouteData,
        }),
        queryParams: new BehaviorSubject({ incidentId: '1234' }),
        snapshot: {
          params: {
            tenant: 'test-tenant-id',
          },
          queryParams: {},
        },
      };

      const mockIncidentService: IncidentService = {
        getIncidentCountByFilter: vi.fn(() => of(1)),
        getIncidentsByFilterAndPagination: vi.fn(() => of([{ id: '1234' }])),
      } as unknown as IncidentService;

      const mockConfirmActionService = {
        retryJob: vi.fn((tenantId: string, ids: string[], lineItems: string, successCallback?: any) => {
          successCallback();
          return of({});
        }),
      };

      beforeEach(async () => {
        TestBed.configureTestingModule({
          declarations: [IncidentsTabComponent],
          providers: [
            { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
            { provide: ActivatedRoute, useValue: mockActivatedRoute },
            { provide: Router, useValue: mockRouter },
            ItemDetailPageCommunicationService,
            { provide: IncidentService, useValue: mockIncidentService },
            { provide: ConfirmActionService, useValue: mockConfirmActionService },
            { provide: WINDOW, useValue: mockWindow },
            PermissionService,
          ],
          schemas: [NO_ERRORS_SCHEMA],
        });

        fixture = TestBed.createComponent(IncidentsTabComponent);
        component = fixture.componentInstance;
        component.parentItemType = itemTypeForRouteData;
        fixture.detectChanges();

        vi.clearAllMocks();

        await fixture.whenStable();
        vi.useFakeTimers();
      });

      afterEach(() => vi.useRealTimers());

      it('should load data when the detailItem is set', async () => {
        const filterParam =
          itemTypeForRouteData === ItemType.ProcessDefinition ? 'processDefinitionId' : 'processInstanceId';
        component.detailItem = { id: '123', type: itemTypeForRouteData };
        expect(component.isLoading).toBe(true);
        await vi.runAllTimersAsync();
        component.eventBus.setDiagramRendered(true);

        expect(mockIncidentService.getIncidentsByFilterAndPagination).toHaveBeenCalledWith({
          filter: {
            [filterParam]: '123',
            open: true,
            sortBy: 'createTime',
            sortOrder: 'desc',
          },
          maxResults: 50,
          firstResult: 0,
        });
        expect(component.isLoading).toBe(false);
        expect(component.data).toEqual([{ id: '1234' }]);
      });

      it('should set selectedItemId when the route is changed', async () => {
        expect(component.selectedItemId).toBeFalsy();
        component.detailItem = { id: '123', type: ItemType.ProcessInstance };
        await vi.runAllTimersAsync();
        mockActivatedRoute.queryParams.next({ incidentId: '12345' });
        expect(component.selectedItemId).toEqual('12345');
      });

      it('should have proper value from columnDefs', () => {
        component.detailItem = { id: '123', type: ItemType.ProcessInstance };
        fixture.detectChanges();
        expect(component.columnDefinitions).toMatchSnapshot();
      });

      it('should handle empty list of incident items', async () => {
        const spyGetIncidentsByFilterAndPagination = vi.spyOn(mockIncidentService, 'getIncidentsByFilterAndPagination');

        spyGetIncidentsByFilterAndPagination.mockImplementation(() => of([]));
        component.detailItem = { id: '123', type: ItemType.ProcessInstance };
        component.eventBus.setDiagramRendered(true);
        await vi.advanceTimersByTimeAsync(1);
        expect(component.data).toEqual([]);
      });

      it('should update the url with the activityId when a row is clicked', () => {
        component.onRowClick({ data: { activityId: 'testActivityId' } } as RowClickedEvent);

        expect(mockRouter.navigate).toHaveBeenCalledWith([], {
          replaceUrl: true,
          queryParams: { tab: 'incidents', activityId: 'testActivityId' },
        });
      });

      it('should update the url and remove activityId when a row is deselected', () => {
        component.onRowClick({} as RowClickedEvent);

        expect(mockRouter.navigate).toHaveBeenCalledWith([], {
          replaceUrl: true,
          queryParams: { tab: 'incidents', activityId: undefined },
        });
      });

      it('should call the confirm action service when trying to retry an incident', async () => {
        component.onSelectionChanged([{ processDefinitionKey: 'defKey', id: '4321', configuration: '1234' }]);
        const loadDataSpy = vi.spyOn(component, 'loadData');
        const resetUrlSpy = vi.spyOn(component, 'resetUrl');
        await component.retry();
        expect(mockConfirmActionService.retryJob).toHaveBeenCalledWith(
          mockActivatedRoute.snapshot.params.tenant,
          ['1234'],
          [{ processDefinitionKey: 'defKey', id: '4321', configuration: '1234' }],
          expect.any(Function),
        );
        expect(loadDataSpy).toHaveBeenCalled();
        expect(resetUrlSpy).toHaveBeenCalled();
      });

      describe('column preferences', () => {
        const itemType = itemTypeForRouteData;
        const tab = PimTab.Incidents;

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

        it('should load the column preferences from local storage', async () => {
          const listView = new ListViewState([{ colId: 'id', pinned: true, width: 330 }]);

          await vi.runAllTimersAsync();

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
          component.init();
          const resetUrlSpy = vi.spyOn(component, 'resetUrl');
          const mockItemTable = { resetColumnDefs: vi.fn() };
          component.itemTable = mockItemTable as unknown as ItemsTableComponent;
          component.onFilterChanged({ testFilter: 'test-value' });
          component.onSortChanged([{ sort: 'asc', colId: 'version' }]);

          component.onResetGridClick();

          expect(component.filters).toEqual({});
          expect(component.sorting).toEqual([{ colId: 'createTime', sort: 'desc' }]);
          expect(resetUrlSpy).toHaveBeenCalled();
          expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
        });
      });

      describe('should handle user permissions', () => {
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
  });
});
