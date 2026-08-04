import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemType, ListViewState } from '@fxn/types';
import { RowClickedEvent } from 'ag-grid-community';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ConfirmModalService, ToastService } from '@fxn/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PimTab } from '../../item-detail-tab-utils';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { FailedJobsTabComponent } from './failed-jobs-tab.component';

describe('failed-jobs-tab.component', () => {
  let fixture: ComponentFixture<FailedJobsTabComponent>;
  let component: FailedJobsTabComponent;

  const mockJobs = [
    { id: '1', name: 'Test Job 1' },
    { id: '2', name: 'Test Job 2' },
  ];
  const mockJobService = {
    getJobsByFilter: vi.fn().mockReturnValue(of(mockJobs)),
    deleteJobs: vi.fn().mockReturnValue(of(undefined)),
  };
  const mockConfirm = {
    show: vi.fn().mockResolvedValue({ confirmed: true }),
  };

  const mockModalComponent = { title: '', text: '' };
  const mockModal = {
    open: vi.fn().mockReturnValue({ componentInstance: mockModalComponent }),
  };
  const mockSelectedRows = [
    { id: '1', name: 'Test Row 1' },
    { id: '2', name: 'Test Row 2' },
  ];
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
    url: 'current-url',
  };

  const mockRoute = {
    queryParams: new BehaviorSubject({ jobId: 'asdf' }),
    snapshot: {
      queryParams: {},
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [FailedJobsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ItemDetailPageCommunicationService },
        { provide: JobService, useValue: mockJobService },
        { provide: ToastService, useValue: mockToast },
        { provide: ConfirmModalService, useValue: mockConfirm },
        { provide: NgbModal, useValue: mockModal },
      ],
    });
    TestBed.overrideProvider(NgbModal, { useValue: mockModal });

    fixture = TestBed.createComponent(FailedJobsTabComponent);
    component = fixture.componentInstance;

    component.selectedRows = mockSelectedRows;

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load data when the detailItem is set', async () => {
    component.detailItem = { id: '123', type: ItemType.Batch };
    expect(component.isLoading).toBe(true);
    await vi.runAllTimersAsync();
    expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
      filter: {
        jobDefinitionId: '123',
        active: true,
        noRetriesLeft: true,
        withException: true,
        sorting: [{}],
      },
      maxResults: 50,
      firstResult: 0,
    });
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual(mockJobs);
  });

  it('has the appropriate initial pagination state', async () => {
    component.init();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.firstResult).toEqual(0);
    expect(component.maxResults).toEqual(50);
  });

  it('deletes failed jobs', async () => {
    component.selectedRows = mockSelectedRows;
    await component.delete();
    expect(mockJobService.deleteJobs).toHaveBeenCalledWith(['1', '2']);
    expect(mockToast.success).toHaveBeenCalledWith('The delete action was successful for all selected jobs');
  });

  it('shows an error when failing to delete jobs', async () => {
    mockJobService.deleteJobs.mockReturnValue(throwError(() => new Error('Mock error')));
    await component.delete();
    expect(mockToast.error).toHaveBeenCalledWith('There was an error trying to delete these jobs: Mock error');
  });

  it('should show the confirmation modal when trying to delete a failed job', () => {
    component.delete();
    expect(mockConfirm.show).toHaveBeenCalled();
  });

  it('should show a modal with the exception message when clicking on an exception message cell', () => {
    component.onCellClicked({
      colDef: { cellRendererParams: { isOpenModalOnClick: true } },
      value: 'Not a data column',
    } as any);

    expect(mockModal.open).toHaveBeenCalled();
  });

  it('should set selected activityId and navigate on row selected', () => {
    component.onRowClick({ data: { activityId: 'activity123' } } as RowClickedEvent);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      replaceUrl: true,
      queryParams: { tab: 'failed-jobs', activityId: 'activity123' },
    });
  });

  describe('column preferences', () => {
    const itemType = ItemType.Batch;
    const tab = PimTab.FailedJobs;

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

      component.detailItem = { id: '123', type: ItemType.Batch };
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
