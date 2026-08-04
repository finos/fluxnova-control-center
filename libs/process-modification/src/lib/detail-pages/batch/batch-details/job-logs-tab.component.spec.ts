import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ItemType, ListViewState } from '@fxn/types';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PimTab } from '../../item-detail-tab-utils';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { JobLogsTabComponent } from './job-logs-tab.component';

describe('job-logs-tab.component', () => {
  let fixture: ComponentFixture<JobLogsTabComponent>;
  let component: JobLogsTabComponent;

  const mockJobs = [
    { id: '1', name: 'Test Job 1' },
    { id: '2', name: 'Test Job 2' },
  ];
  const mockJobService = {
    getJobLogsByFilter: vi.fn().mockReturnValue(of(mockJobs)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [],
      declarations: [JobLogsTabComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter([]),
        { provide: ItemDetailPageCommunicationService },
        { provide: JobService, useValue: mockJobService },
      ],
    });

    fixture = TestBed.createComponent(JobLogsTabComponent);
    component = fixture.componentInstance;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load data when the detailItem is set', async () => {
    component.detailItem = { id: '123', type: ItemType.Batch };
    expect(component.isLoading).toBe(true);
    await vi.runAllTimersAsync();
    expect(mockJobService.getJobLogsByFilter).toHaveBeenCalledWith({
      filter: {
        jobDefinitionId: '123',
        sortBy: 'timestamp',
        sortOrder: 'desc',
      },
      maxResults: 50,
      firstResult: 0,
    });
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual(mockJobs);
  });

  describe('column preferences', () => {
    const itemType = ItemType.Batch;
    const tab = PimTab.JobLogs;

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
      component.init();
      const resetUrlSpy = vi.spyOn(component, 'resetUrl');
      const mockItemTable = { resetColumnDefs: vi.fn() };
      component.itemTable = mockItemTable as unknown as ItemsTableComponent;
      component.onFilterChanged({ testFilter: 'test-value' });
      component.onSortChanged([{ sort: 'asc', colId: 'version' }]);

      component.onResetGridClick();

      expect(component.filters).toEqual({});
      expect(component.sorting).toEqual([{ colId: 'timestamp', sort: 'desc' }]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
