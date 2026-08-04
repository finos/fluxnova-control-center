import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { RowClassParams, RowClickedEvent } from 'ag-grid-community';
import { ItemType, ListViewState } from '@fxn/types';
import { BehaviorSubject, of } from 'rxjs';
import { AuthorizationHttpService, PermissionService } from '@fxn/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { PimTab } from '../../item-detail-tab-utils';
import { JobDefinitionsTabComponent } from './job-definitions-tab.component';

describe('JobDefinitionsTabComponent', () => {
  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  let component: JobDefinitionsTabComponent;
  let fixture: ComponentFixture<JobDefinitionsTabComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const jobDefinitionId = 'jobDefinitionId123';

  const mockRouter = {
    navigate: vi.fn(),
    url: 'current-url',
    navigateByUrl: () => ({ then: vi.fn() }),
  };

  const mockJobService = {
    getJobDefinitionsByFilter: vi.fn().mockReturnValue(of([{ jobDefinitionId: '1234' }])),
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({ jobDefinitionId: 'asdf' }),
    snapshot: {
      queryParams: {},
    },
  };

  const mockConfirmActionService = {
    suspendOrActivateJobDefinition: vi.fn((ids: string[], action: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    setJobDefinitionPriority: vi.fn((id: string, lineItems: string, priorityIsSet: boolean, successCallback?: any) => {
      successCallback();
      return of({});
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JobDefinitionsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: JobService, useValue: mockJobService },
        ItemDetailPageCommunicationService,
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: WINDOW, useValue: mockWindow },
        PermissionService,
      ],
    });
    fixture = TestBed.createComponent(JobDefinitionsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.itemTable = {
      agGrid: {
        api: {
          getColumn: vi.fn().mockImplementation((field) => field === 'activityId'),
          setColumnFilterModel: vi.fn().mockResolvedValue(undefined),
          onFilterChanged: vi.fn(),
          redrawRows: vi.fn(),
          getRenderedNodes: vi.fn(() => []),
        },
      } as unknown as AgGridAngular,
    } as ItemsTableComponent;
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data when the detailItem is set', async () => {
    component.detailItem = { id: '123', type: ItemType.ProcessDefinition };
    expect(component.isLoading).toBe(true);
    await vi.runAllTimersAsync();
    expect(mockJobService.getJobDefinitionsByFilter).toHaveBeenCalledWith({
      filter: { processDefinitionId: '123' },
      maxResults: 50,
      firstResult: 0,
    });
    component.eventBus.setDiagramRendered(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual([{ jobDefinitionId: '1234' }]);
  });

  it('should set selectedItemId when the route is changed', async () => {
    expect(component.selectedItemId).toBeFalsy();
    component.detailItem = { id: '123', type: ItemType.ProcessDefinition };
    await vi.runAllTimersAsync();
    mockRoute.queryParams.next({ jobDefinitionId });
    expect(component.selectedItemId).toEqual(jobDefinitionId);
  });

  it('should update the url with the activityId when a row is clicked', () => {
    component.onRowClick({ data: { activityId: 'activityId123' } } as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { tab: 'job-definitions', activityId: 'activityId123' },
    });
  });

  it('should update the url and remove activityId when a row is deselected', () => {
    component.onRowClick({} as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { tab: 'job-definitions', activityId: undefined },
    });

    component.highlightedActivityId = 'act123';
    component.selectedItemId = 'id123';
    component.onRowClick({ data: { id: 'id123', activityId: 'act123' } } as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { tab: 'job-definitions', activityId: undefined },
    });
  });

  it('should return true for canActivate if only 1 suspended row is selected', () => {
    component.onSelectionChanged([
      { id: jobDefinitionId, jobDefinition: { activityId: 'activityId123' }, suspended: true },
    ]);
    expect(component.canActivate()).toEqual(true);
  });

  it('should return false for canActivate if only 1 active row is selected', () => {
    component.onSelectionChanged([
      { id: jobDefinitionId, jobDefinition: { activityId: 'activityId123' }, suspended: false },
    ]);
    expect(component.canActivate()).toEqual(false);
  });

  it('should return true for canSuspend if only 1 active row is selected', () => {
    component.onSelectionChanged([
      { id: jobDefinitionId, jobDefinition: { activityId: 'activityId123' }, suspended: false },
    ]);
    expect(component.canSuspend()).toEqual(true);
  });

  it('should return false for canSuspend if no rows are selected', () => {
    component.onSelectionChanged([]);
    expect(component.canSuspend()).toEqual(false);
  });

  it('should return false for canActivate if no rows are selected', () => {
    component.onSelectionChanged([]);
    expect(component.canActivate()).toEqual(false);
  });

  it('should return false for canSuspend if only 1 suspended row is selected', () => {
    component.onSelectionChanged([
      { id: jobDefinitionId, jobDefinition: { activityId: 'activityId123' }, suspended: true },
    ]);
    expect(component.canSuspend()).toEqual(false);
  });

  it('should return false for suspend and activate if multiple job definitions are selected that are both active and suspended', () => {
    component.onSelectionChanged([
      { id: jobDefinitionId, jobDefinition: { activityId: 'activityId123' }, suspended: false },
      { id: 'jobDefinitionId456', jobDefinition: { activityId: 'activityId123' }, suspended: true },
    ]);

    expect(component.canSuspend()).toEqual(false);
    expect(component.canActivate()).toEqual(false);
  });

  it('should call the confirm action service when trying to suspend a job definition', async () => {
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    await component.suspend();
    expect(mockConfirmActionService.suspendOrActivateJobDefinition).toHaveBeenCalledWith(
      ['1234'],
      'Suspend',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  it('should call the confirm action service when trying to activate a job definition', async () => {
    component.onSelectionChanged([{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }]);
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    await component.activate();
    expect(mockConfirmActionService.suspendOrActivateJobDefinition).toHaveBeenCalledWith(
      ['1234'],
      'Activate',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234' }],
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  it('should call the confirm action service when trying to set priority on a job definition', async () => {
    component.onSelectionChanged([
      { processDefinitionKey: 'fluxnova_automation_basic', id: '1234', overridingJobPriority: null },
    ]);
    const loadDataSpy = vi.spyOn(component, 'loadData');
    const resetUrlSpy = vi.spyOn(component, 'resetUrl');
    await component.setPriority();
    expect(mockConfirmActionService.setJobDefinitionPriority).toHaveBeenCalledWith(
      '1234',
      [{ processDefinitionKey: 'fluxnova_automation_basic', id: '1234', overridingJobPriority: null }],
      false,
      expect.any(Function),
    );
    expect(loadDataSpy).toHaveBeenCalled();
    expect(resetUrlSpy).toHaveBeenCalled();
  });

  describe('Highlight and redraw grid rows', () => {
    it('should redraw rows when highlightedActivityId changes', () => {
      component.itemTable = {
        agGrid: {
          api: {
            getRenderedNodes: vi.fn(() => [
              { data: { id: '1', activityId: 'act1' } },
              { data: { id: '2', activityId: 'act2' } },
              { data: { id: '3', activityId: 'act3' } },
            ]),
            redrawRows: vi.fn(),
          } as unknown as AgGridAngular,
        },
      } as unknown as ItemsTableComponent;
      component.highlightedActivityId = 'act1';
      expect(component.agGrid?.api?.redrawRows).toHaveBeenCalledWith({
        rowNodes: [{ data: { id: '1', activityId: 'act1' } }],
      });
      expect(component.highlightedActivityId).toEqual('act1');
      component.highlightedActivityId = 'act2';
      expect(component.itemTable?.agGrid?.api?.redrawRows).toHaveBeenCalledWith({
        rowNodes: [{ data: { id: '1', activityId: 'act1' } }, { data: { id: '2', activityId: 'act2' } }],
      });
      expect(component.highlightedActivityId).toEqual('act2');
    });

    it('should highlight and redraw row if row id is in selectedIds and rowClickSelection is true', () => {
      component.onRowClick({ data: { id: '1', activityId: 'act123' } } as RowClickedEvent);
      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        queryParams: {
          tab: 'job-definitions',
          jobDefinitionId: '1',
          activityId: 'act123',
          filteredActivityId: undefined,
        },
        replaceUrl: true,
      });
    });

    it('should return class row-highlighted if highlightedActivityId and selectedItemIds match', () => {
      component.itemTable = {
        agGrid: {
          api: {
            getRenderedNodes: vi.fn(() => [
              { data: { id: '1', activityId: 'act1' } },
              { data: { id: '2', activityId: 'act2' } },
              { data: { id: '3', activityId: 'act3' } },
            ]),
            redrawRows: vi.fn(),
          } as unknown as AgGridAngular,
        },
      } as unknown as ItemsTableComponent;
      component.selectedItemId = '1';
      component.highlightedActivityId = 'act1';
      expect(
        component.rowClassRules()['row-highlighted']({ data: { id: '1', activityId: 'act1' } } as RowClassParams),
      ).toBe(true);
      expect(
        component.rowClassRules()['row-highlighted']({ data: { id: '2', activityId: 'act1' } } as RowClassParams),
      ).toBe(false);
      expect(component.rowClassRules()['row-highlighted']({ data: { id: '3' } } as RowClassParams)).toBe(false);
      expect(component.itemTable?.agGrid?.api?.redrawRows).toHaveBeenCalledWith({
        rowNodes: [{ data: { id: '1', activityId: 'act1' } }],
      });
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.ProcessDefinition;
    const tab = PimTab.JobDefinitions;

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
      expect(component.sorting).toEqual([]);
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
