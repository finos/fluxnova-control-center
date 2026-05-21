import { Component, inject, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { Observable, Subscription } from 'rxjs';
import { failedJobColFields, predefinedDetailPageFailedJobTabColDef, predefinedJobColDefs } from '@fxn/types';
import { ConfirmModalService, MODAL_DEFAULTS } from '@fxn/common';
import { ColDef } from 'ag-grid-community';
import { PimTab } from '../../item-detail-tab-utils';
import { BaseBatchDetailsTabComponent } from './base-batch-details-tab.component';

@Component({
  selector: 'fluxnova-failed-jobs-tab',
  templateUrl: './failed-jobs-tab.component.html',
  styleUrl: './failed-jobs-tab.component.scss',
  standalone: false,
})
export class FailedJobsTabComponent extends BaseBatchDetailsTabComponent implements OnDestroy {
  private confirm = inject(ConfirmModalService);

  override columnDefinitions: ColDef<any, any>[] = failedJobColFields.map((colId: string) => ({
    colId,
    ...predefinedJobColDefs[colId],
    ...predefinedDetailPageFailedJobTabColDef[colId],
    floatingFilter: false,
  }));

  override get tab(): PimTab {
    return PimTab.FailedJobs;
  }

  subs = new SubSink();
  modifyJobs$?: Subscription;
  selectedRows: any[] = [];

  override get dataFilter(): any {
    return {
      jobDefinitionId: this.detailItemId,
      withException: true,
      noRetriesLeft: true,
      active: true,
      sorting: [
        {
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
        },
      ],
      ...this.userSuppliedFilters,
    };
  }

  async delete() {
    const result = await this.confirm.show(
      {
        message: '<p class="ps-3">Are you sure you want to delete these jobs?</p>',
        lineItems: this.selectedRows,
        title: 'Delete Job(s)',
        confirmButtonLabel: 'Delete',
      },
      {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      },
    );
    if (result?.confirmed) {
      this.handleDeleteOrRetry(this.jobService.deleteJobs(this.selectedRows.map((job) => job.id)), 'delete');
    }
  }

  setRetries() {
    this.handleDeleteOrRetry(this.jobService.retryJobs(this.selectedRows.map((job) => job.id)), 'retry');
  }

  protected handleDeleteOrRetry(obs: Observable<string>, action: string) {
    if (this.modifyJobs$) this.modifyJobs$.unsubscribe();

    this.modifyJobs$ = obs.subscribe({
      error: (err: any) => {
        this.toastService.error(`There was an error trying to ${action} these jobs: ${err.message}`);
      },
      complete: () => {
        this.toastService.success(`The ${action} action was successful for all selected jobs`);
        this.loadData();

        // Trigger the tab count to reload
        this.sendFilterChangedNotification();
      },
    });
  }
}
