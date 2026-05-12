import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ItemType, ListViewState } from '@fxn/types';
import { of } from 'rxjs';
import { GridModule } from '@fxn/grid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimTab } from '../../item-detail-tab-utils';
import { ItemsTableComponent } from '../../../common/items-table/items-table.component';
import { RemainingJobsTabComponent } from './remaining-jobs-tab.component';

describe('RemainingJobsTabComponent', () => {
  let fixture: ComponentFixture<RemainingJobsTabComponent>;
  let component: RemainingJobsTabComponent;

  const mockJobs = [
    {
      id: 'testDefinitionId',
    },
  ];
  const mockJobService = {
    getJobsByFilter: vi.fn(() => of(mockJobs)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GridModule],
      declarations: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter([]),
        { provide: ItemDetailPageCommunicationService },
        { provide: JobService, useValue: mockJobService },
      ],
    });
    fixture = TestBed.createComponent(RemainingJobsTabComponent);
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
    expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
      filter: {
        jobDefinitionId: '123',
        sorting: [{}],
      },
      maxResults: 50,
      firstResult: 0,
    });
    expect(component.isLoading).toBe(false);
    expect(component.data).toEqual(mockJobs);
  });

  it('has the appropriate initial pagination state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.firstResult).toEqual(0);
    expect(component.maxResults).toEqual(50);
  });

  describe('column preferences', () => {
    const itemType = ItemType.Batch;
    const tab = PimTab.RemainingJobs;

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
      expect(component.sorting).toEqual([]);
      expect(resetUrlSpy).toHaveBeenCalled();
      expect(mockItemTable.resetColumnDefs).toHaveBeenCalledWith(new ListViewState(component.columnDefinitions));
    });
  });
});
