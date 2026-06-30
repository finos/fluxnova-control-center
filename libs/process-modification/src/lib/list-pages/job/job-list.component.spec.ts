import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { AuthorizationHttpService } from '@fxn/common';
import { provideHttpClient } from '@angular/common/http';
import { WINDOW } from 'ngx-window-token';
import { JobService } from '../../services/job.service';
import { ConfirmActionService } from '../../services/confirm-action.service';
import { JobListComponent } from './job-list.component';

describe('JobListComponent', () => {
  let component: JobListComponent;
  let fixture: ComponentFixture<JobListComponent>;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(true),
  };

  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  const qp$ = new BehaviorSubject({});

  const mockRoute = {
    snapshot: { params: { tenant: 'test-tenant-id' } },
    queryParams: qp$,
  };

  const mockRouter = {
    navigate: vi.fn((arry: [], opts: any) => {
      qp$.next(opts.queryParams);
    }),
    events: of({}),
  };

  const mockConfirmActionService = {
    suspendOrActivateJob: vi.fn((ids: string[], action: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    changeJobDueDate: vi.fn((id: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    deleteJob: vi.fn((id: string, lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
    retryJob: vi.fn((tenantId: string, ids: string[], lineItems: string, successCallback?: any) => {
      successCallback();
      return of({});
    }),
  };

  const mockJobService = {
    getJobsByFilter: vi.fn(() =>
      of([
        {
          id: '123',
        },
      ]),
    ),
    getJobCountByFilter: vi.fn(() => of(1)),
    updateSuspendStatus: vi.fn(),
    deleteJob: vi.fn(),
  } as unknown as JobService;

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  const buildComponent = (routeOverride?: any) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [JobListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: JobService, useValue: mockJobService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: routeOverride ?? mockRoute },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });
    fixture = TestBed.createComponent(JobListComponent);
    component = fixture.componentInstance;

    qp$.next({});
    vi.clearAllMocks();
  };

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => vi.useRealTimers());

  describe('when there are no query string params', () => {
    beforeEach(() => {
      buildComponent();
    });

    it('should load the data with what was saved in local storage', async () => {
      localStorageMock.getItem.mockImplementationOnce((key: string) => {
        expect(key).toBe('job-list.params');
        return {
          filters: { processDefinitionKey: { filter: 'fluxnova_automation_basic', type: 'equals' } },
          sorting: [{ colId: 'dueDate', sort: 'asc' }],
        };
      });

      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
        filter: {
          processDefinitionKey: 'fluxnova_automation_basic',
          sorting: [{ sortBy: 'jobDueDate', sortOrder: 'asc' }],
        },
        firstResult: 0,
        maxResults: 50,
      });
    });

    it('should load the data with the default parameters when there is nothing saved in local storage', async () => {
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
        filter: { withRetriesLeft: true, sorting: [{ sortBy: 'jobDueDate', sortOrder: 'desc' }] },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('when there are query string params', () => {
    it('should use them to load data', async () => {
      buildComponent({
        queryParams: of({
          filters: { suspended: { filterType: 'select', filter: 'active', type: 'equals' } },
          sorting: [{ colId: 'dueTime', sort: 'asc' }],
          page: 1,
          pageSize: 50,
          toggleFilters: 'withRetriesLeft',
        }),
      });
      fixture.detectChanges();

      await vi.runAllTimersAsync();

      expect(mockJobService.getJobsByFilter).toHaveBeenCalledWith({
        filter: { withRetriesLeft: true, active: true, sorting: [{ sortBy: 'dueTime', sortOrder: 'asc' }] },
        firstResult: 0,
        maxResults: 50,
      });
    });
  });

  describe('should handle actions', () => {
    const mockJob = { processDefinitionKey: 'fluxnova_automation_basic', id: '1234', suspended: true };
    let loadDataSpy: Mock;
    beforeEach(() => {
      buildComponent();
      component.selectedRows = [mockJob];
      loadDataSpy = vi.spyOn(component, 'loadData');
    });

    it('should handle activate action', async () => {
      await component.activate();
      expect(mockConfirmActionService.suspendOrActivateJob).toHaveBeenCalledWith(
        ['1234'],
        'Activate',
        [{ id: '1234', processDefinitionKey: 'fluxnova_automation_basic', suspended: true }],
        expect.any(Function),
      );
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle suspend action', async () => {
      await component.suspend();
      expect(mockConfirmActionService.suspendOrActivateJob).toHaveBeenCalledWith(
        ['1234'],
        'Suspend',
        [{ id: '1234', processDefinitionKey: 'fluxnova_automation_basic', suspended: true }],
        expect.any(Function),
      );
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle delete action', async () => {
      await component.delete();
      expect(mockConfirmActionService.deleteJob).toHaveBeenCalledWith(
        '1234',
        [{ id: '1234', processDefinitionKey: 'fluxnova_automation_basic', suspended: true }],
        expect.any(Function),
      );
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle retry action', async () => {
      await component.retry();
      expect(mockConfirmActionService.retryJob).toHaveBeenCalledWith(
        mockRoute.snapshot.params.tenant,
        ['1234'],
        [{ id: '1234', processDefinitionKey: 'fluxnova_automation_basic', suspended: true }],
        expect.any(Function),
      );
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle change job due date action', async () => {
      await component.changeDueDate();
      expect(mockConfirmActionService.changeJobDueDate).toHaveBeenCalledWith(
        '1234',
        [{ id: '1234', processDefinitionKey: 'fluxnova_automation_basic', suspended: true }],
        expect.any(Function),
      );
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  describe('should handle user permissions', () => {
    beforeEach(() => {
      buildComponent();
    });

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
