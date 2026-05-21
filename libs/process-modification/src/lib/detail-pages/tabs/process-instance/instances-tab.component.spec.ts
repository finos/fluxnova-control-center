import { LetDirective } from '@ngrx/component';
import { IRowNode } from 'ag-grid-community';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemType, ListViewState, ProcessInstanceStatesMap, processInstanceTabDefaultFilters } from '@fxn/types';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { MockFluxnovaHasPermissionsDirective } from '@fxn/test-support/src/lib/mock-fluxnova-has-permissions-directive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationHttpService } from '@fxn/common';
import { WINDOW } from 'ngx-window-token';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimTab } from '../../item-detail-tab-utils';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { InstancesTabComponent } from './instances-tab.component';

describe('Instances Tab', () => {
  let component: InstancesTabComponent;
  let fixture: ComponentFixture<InstancesTabComponent>;
  let nativeElement: HTMLElement;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const mockDefinitionService = {
    getProcessDefinitionVersionsById: vi.fn().mockReturnValue(of([{ version: 1, id: 'asdf' }])),
  };
  const mockInstanceService = {
    getProcessInstancesWithIncidentInfo: vi.fn().mockReturnValue(of([{ id: 'asdf' }])),
    getProcessInstanceCountByFilter: vi.fn().mockReturnValue(of(1)),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({ processInstanceId: 'asdf' }),
  };

  let eventBus: ItemDetailPageCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InstancesTabComponent, MockFluxnovaHasPermissionsDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [LetDirective, NgbModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: Router, useValue: mockRouter },
        { provide: ProcessInstanceService, useValue: mockInstanceService },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });
    eventBus = TestBed.inject(ItemDetailPageCommunicationService);
    fixture = TestBed.createComponent(InstancesTabComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should setup reload subscription', async () => {
    component.init();
    eventBus.reloadNeeded();

    await vi.advanceTimersByTimeAsync(201);

    expect(component.reloadNeededSub$).toBeDefined();
    expect(mockInstanceService.getProcessInstancesWithIncidentInfo).toHaveBeenCalledTimes(2);
  });

  it('should setup pagination subscription', async () => {
    component.init();

    await vi.advanceTimersByTimeAsync(201);

    expect(component.paginationSubject$).toBeDefined();
    expect(component.firstResult).toBe(0);
    expect(component.maxResults).toBe(50);
  });

  it('does not allow completed or terminated instances to be selected', () => {
    expect(
      component.isRowSelectable({
        data: { id: 'a', state: ProcessInstanceStatesMap.COMPLETED.value },
      } as IRowNode),
    ).toBe(false);
    expect(
      component.isRowSelectable({
        data: { id: 'a', state: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.value },
      } as IRowNode),
    ).toBe(false);
    expect(
      component.isRowSelectable({
        data: { id: 'a', state: ProcessInstanceStatesMap.ACTIVE.value },
      } as IRowNode),
    ).toBe(true);
    expect(
      component.isRowSelectable({
        data: { id: 'a', state: ProcessInstanceStatesMap.SUSPENDED.value },
      } as IRowNode),
    ).toBe(true);
  });

  it('clears any selected instances whenever a filter is applied', async () => {
    component.onSelectionChange([{ id: 'test' }]);
    expect(component.selectedRows?.length).toEqual(1);
    await component.onFilterChanged({
      state: {
        filterType: 'select',
        filter: 'active',
        type: 'equals',
      },
    });
    expect(component.selectedRows?.length).toEqual(0);
  });

  it('converts filter and sorting to instances load options and refreshes the data', async () => {
    const processDefinitionId = 'processDefinitionId123';
    component.detailItem = { id: processDefinitionId, type: ItemType.ProcessDefinition };
    await vi.runAllTimersAsync();
    component.onFilterChanged({
      state: {
        filterType: 'select',
        filter: 'active',
        type: 'equals',
      },
    });
    await vi.runAllTimersAsync();
    expect(mockInstanceService.getProcessInstancesWithIncidentInfo).toHaveBeenCalledWith({
      filter: {
        processDefinitionId,
        active: true,
        sortOrder: 'desc',
        sortBy: 'startTime',
      },
      maxResults: 50,
      firstResult: 0,
    });
  });

  it('should clear subscriptions on destroy', () => {
    component.reloadNeededSub$ = {
      unsubscribe: vi.fn(),
    } as unknown as Subscription;

    component.ngOnDestroy();

    expect(component.reloadNeededSub$.unsubscribe).toHaveBeenCalled();
  });

  describe('Migrate Instance Button', () => {
    let migrateButton: HTMLButtonElement | null;

    beforeEach(() => {
      migrateButton = nativeElement.querySelector('fluxnova-tab-actions-floating-container button:last-of-type');
    });

    it('should be enabled when there are multiple definition versions and active instances', async () => {
      mockDefinitionService.getProcessDefinitionVersionsById.mockReturnValueOnce(
        of([
          { version: 1, id: 'test-id-1' },
          { version: 2, id: 'test-id-2' },
        ]),
      );
      mockInstanceService.getProcessInstanceCountByFilter.mockReturnValueOnce(of(1));

      component.init();
      await vi.runAllTimersAsync();
      fixture.detectChanges();

      expect(migrateButton?.disabled).toBe(false);
    });

    it('should be disabled when there are not multiple definition versions', () => {
      mockDefinitionService.getProcessDefinitionVersionsById.mockReturnValueOnce(of([{ version: 1, id: 'test-id-1' }]));
      mockInstanceService.getProcessInstanceCountByFilter.mockReturnValueOnce(of(1));

      component.init();
      fixture.detectChanges();

      expect(migrateButton?.disabled).toBe(true);
    });

    it('should be disabled when there are no active instances', () => {
      mockDefinitionService.getProcessDefinitionVersionsById.mockReturnValueOnce(
        of([
          { version: 1, id: 'test-id-1' },
          { version: 2, id: 'test-id-2' },
        ]),
      );
      mockInstanceService.getProcessInstanceCountByFilter.mockReturnValueOnce(of(0));

      component.init();
      fixture.detectChanges();

      expect(migrateButton?.disabled).toBe(true);
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessDefinition;
    const tab = PimTab.Instances;

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

      expect(component.filters).toEqual(processInstanceTabDefaultFilters);
      expect(component.sorting).toEqual([{ colId: 'startTime', sort: 'desc' }]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });

  describe('should display "Migrate Instances" button if user has permission', () => {
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
