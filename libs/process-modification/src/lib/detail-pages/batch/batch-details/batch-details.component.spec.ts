import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConfirmModalService, ToastService } from '@fxn/common';
import { Batch } from '@fxn/types';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ButtonActions } from '@fxn/types/src/button-actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobService } from '../../../services/job.service';
import { BatchService } from '../../../services/support/batch.service';
import { PimTab } from '../../item-detail-tab-utils';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { BatchDetailsComponent } from './batch-details.component';

describe('batch-details.component', () => {
  let component: BatchDetailsComponent;
  let fixture: ComponentFixture<BatchDetailsComponent>;
  const mockJobCounts = 999;
  const mockFailedJobCounts = 1000;
  const mockBatch = {
    id: 'testId',
    batchJobDefinitionId: 'batchJobDefinitionId',
  } as Batch;
  const mockBatchService = {
    getBatch: vi.fn().mockReturnValue(of(mockBatch)),
    deleteHistoric: vi.fn().mockReturnValue(of(undefined)),
    delete: vi.fn().mockReturnValue(of(undefined)),
    suspend: vi.fn().mockReturnValue(of({})),
  };
  const mockJobService = {
    getJobLogCountByFilter: vi.fn().mockReturnValue(of(mockJobCounts)),
    getJobCountByFilter: vi.fn().mockReturnValue(of(mockFailedJobCounts)),
    retryJobsByDefinition: vi.fn().mockReturnValue(of(undefined)),
  };
  const mockRoute = {
    params: of({
      id: 'testId',
    }),
    queryParams: of({
      sorting: {},
    }),
    snapshot: {
      queryParams: {},
      params: { id: 'testId' },
    },
  };
  const mockConfirm = {
    show: vi.fn().mockResolvedValue({ confirmed: true }),
  };
  const mockConfirmActionService = {
    activateOrSuspendBatch: vi.fn().mockReturnValue(of(undefined)),
    retryJobsForBatch: vi.fn().mockReturnValue(of(undefined)),
    deleteBatch: vi.fn().mockReturnValue(of(undefined)),
  };
  const mockToast = {
    success: vi.fn(),
  };

  function createEvent(action: string, target: string): ToolbarEvent {
    return {
      action: action,
      target: target,
    } as ToolbarEvent;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [BatchDetailsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ToastService, useValue: mockToast },
        { provide: ConfirmModalService, useValue: mockConfirm },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: BatchService, useValue: mockBatchService },
        { provide: JobService, useValue: mockJobService },
      ],
    });

    fixture = TestBed.createComponent(BatchDetailsComponent);
    component = fixture.componentInstance;

    vi.spyOn(component, 'delete');
    vi.spyOn(component, 'toggleSuspended');
    vi.spyOn(component, 'retry');

    component.ngOnInit();
  });

  it('loads the current batch', () => {
    expect(component.batch).toEqual(mockBatch);
  });

  it('loads counts', () => {
    component.activeTabsChanged(PimTab.JobLogs);
    expect(component.counts[PimTab.JobLogs]).toEqual(mockJobCounts);
    expect(component.counts[PimTab.FailedJobs]).toEqual(mockFailedJobCounts);
  });

  it('deletes an active batch', async () => {
    await component.delete();
    expect(mockConfirmActionService.deleteBatch).toHaveBeenCalledWith(component.batch.id ?? '', component.batch, {
      success: expect.any(Function),
      canceled: expect.any(Function),
      error: expect.any(Function),
    });
  });

  it('deletes a historic batch', async () => {
    component.batch.endTime = 'realValidTime';
    await component.delete();
    expect(mockConfirmActionService.deleteBatch).toHaveBeenCalledWith(component.batch.id ?? '', component.batch, {
      success: expect.any(Function),
      canceled: expect.any(Function),
      error: expect.any(Function),
    });
  });

  it('retries failed jobs by job definition', () => {
    component.retry();
    expect(mockConfirmActionService.retryJobsForBatch).toHaveBeenCalledWith('batchJobDefinitionId', {
      success: expect.any(Function),
      canceled: expect.any(Function),
      error: expect.any(Function),
    });
  });

  it('suspends a batch', () => {
    [true, false].forEach((suspended) => {
      component.batch.suspended = suspended;
      component.toggleSuspended();
      expect(mockConfirmActionService.activateOrSuspendBatch).toHaveBeenCalledWith(
        component.batch.id ?? '',
        suspended,
        {
          success: expect.any(Function),
          canceled: expect.any(Function),
          error: expect.any(Function),
        },
      );
    });
  });

  it('should call delete when DELETE button is clicked', () => {
    const event = createEvent('click', ButtonActions.DELETE);
    component.onToolbarButtonClick(event);
    expect(component.delete).toHaveBeenCalled();
  });

  it('should call toggleSuspended when ACTIVATE button is clicked', () => {
    const event = createEvent('click', ButtonActions.ACTIVATE);
    component.onToolbarButtonClick(event);
    expect(component.toggleSuspended).toHaveBeenCalled();
  });

  it('should call toggleSuspended when SUSPEND button is clicked', () => {
    const event = createEvent('click', ButtonActions.SUSPEND);
    component.onToolbarButtonClick(event);
    expect(component.toggleSuspended).toHaveBeenCalled();
  });

  it('should call retry when RETRY button is clicked', () => {
    const event = createEvent('click', ButtonActions.RETRY);
    component.onToolbarButtonClick(event);
    expect(component.retry).toHaveBeenCalled();
  });

  it('should not call any methods if action is not click', () => {
    const event = createEvent('dblclick', ButtonActions.DELETE);
    component.onToolbarButtonClick(event);
    expect(component.delete).not.toHaveBeenCalled();
    expect(component.toggleSuspended).not.toHaveBeenCalled();
    expect(component.retry).not.toHaveBeenCalled();
  });
});
