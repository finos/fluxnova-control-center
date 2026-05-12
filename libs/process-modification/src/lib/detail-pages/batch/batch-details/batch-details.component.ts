import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ConfirmModalService, RouteData, ToastService } from '@fxn/common';
import { Batch, ButtonActions } from '@fxn/types';
import { SubSink } from 'subsink';
import { forkJoin, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { BatchService } from '../../../services/support/batch.service';
import { JobService } from '../../../services/job.service';
import { BatchTabs, PimTab } from '../../item-detail-tab-utils';

@Component({
  selector: 'fluxnova-batch-details',
  templateUrl: './batch-details.component.html',
  styleUrls: ['./batch-details.component.scss'],
  standalone: false,
})
export class BatchDetailsComponent extends ItemDetailPageComponent implements OnInit, OnDestroy {
  private toolbarService = inject(ToolbarService);
  batchService = inject(BatchService);
  jobService = inject(JobService);
  toast = inject(ToastService);
  confirm = inject(ConfirmModalService);

  isLoading = false;
  routeData = this.route.snapshot.data as RouteData;
  batch: Batch = {};
  subs = new SubSink();
  protected readonly isNaN = isNaN;

  ngOnInit() {
    this.isLoading = true;
    this.subs.add(
      this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
      this.batchService.getBatch(this.itemId).subscribe({
        next: (batch) => {
          this.isLoading = false;
          this.batch = batch;
          this.toolbar?.updateButtonStates(this.batch);
          this.toolbar?.enable([ButtonActions.RETRY]);
          this.setUpTabs();
        },
        error: () => {
          this.batch = {};
          this.isLoading = false;
        },
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  override initTabNames() {
    this.tabs = BatchTabs;
  }

  override getInitialTabCount(tab: PimTab): Observable<number> {
    switch (tab) {
      case PimTab.JobLogs:
        return this.jobService.getJobLogCountByFilter({ jobDefinitionId: this.batch.batchJobDefinitionId });
      case PimTab.FailedJobs:
        return this.jobService.getJobCountByFilter({
          jobDefinitionId: this.batch.batchJobDefinitionId,
          withException: true,
          noRetriesLeft: true,
          active: true,
        });
      case PimTab.RemainingJobs:
        return this.jobService.getJobCountByFilter({
          jobDefinitionId: this.batch.batchJobDefinitionId,
        });
      default:
        console.error(`No getInitialTabCount implementation for tab ${tab}`);
        return of(0);
    }
  }

  override getInitialTabCountsObservable() {
    return forkJoin(
      [PimTab.JobLogs, PimTab.FailedJobs, PimTab.RemainingJobs].map((pimTab) => this.getInitialTabCount(pimTab)),
    ).pipe(
      map(([jobLogs, failedJobs, remainingJobs]) => ({
        [PimTab.JobLogs]: jobLogs,
        [PimTab.FailedJobs]: failedJobs,
        [PimTab.RemainingJobs]: remainingJobs,
      })),
      tap((counts) => {
        this.batch.failedJobs = counts[PimTab.FailedJobs];
        this.batch.remainingJobs = counts[PimTab.RemainingJobs];
      }),
    );
  }

  override getUpdatedTabCountsObservable() {
    return this.getInitialTabCountsObservable();
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    if (event.action !== 'click') {
      return;
    }

    switch (event.target) {
      case ButtonActions.DELETE:
        await this.delete();
        break;

      case ButtonActions.ACTIVATE:
      case ButtonActions.SUSPEND:
        await this.toggleSuspended();
        break;

      case ButtonActions.RETRY:
        await this.retry();
        break;
    }
  }

  async delete() {
    return this.confirmActionService.deleteBatch(this.itemId, this.batch, {
      success: this.onDelete.bind(this),
      canceled: this.onActionCancel.bind(this),
      error: this.onActionError.bind(this),
    });
  }

  async retry() {
    this.isLoading = true;
    return this.confirmActionService.retryJobsForBatch(this.batch.batchJobDefinitionId as string, {
      success: this.onRetry.bind(this),
      canceled: this.onActionCancel.bind(this),
      error: this.onActionError.bind(this),
    });
  }

  async toggleSuspended() {
    this.isLoading = true;
    return this.confirmActionService.activateOrSuspendBatch(this.batch.id ?? '', this.batch.suspended ?? false, {
      success: this.onToggleSuspended.bind(this),
      canceled: this.onActionCancel.bind(this),
      error: this.onActionError.bind(this),
    });
  }

  onDelete() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onRetry() {
    this.isLoading = false;
  }

  onToggleSuspended() {
    this.isLoading = false;
    this.batch.suspended = !this.batch.suspended;
    this.toolbar?.updateButtonStates(this.batch);
  }

  onActionCancel() {
    this.isLoading = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onActionError(err: Error) {
    this.isLoading = false;
  }
}
