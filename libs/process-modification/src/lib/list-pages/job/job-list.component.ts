import { Component, inject, ViewChild } from '@angular/core';
import { every, isUndefined } from 'lodash-es';
import { forkJoin, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType, ItemTypeActions, JobFilter, ListOptions } from '@fxn/types';
import { getDefaultListViewState } from '../../common/list-utils';
import { BaseListComponent } from '../base-list.component';
import { JobService } from '../../services/job.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss'],
  standalone: false,
})
export class JobListComponent extends BaseListComponent {
  private jobService = inject(JobService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;
  buttonPermissionsNeeded = [
    ItemTypeActions.SuspendJob,
    ItemTypeActions.ActivateJob,
    ItemTypeActions.SetJobRetryCount,
    ItemTypeActions.DeleteJob,
    ItemTypeActions.ChangeJobDueDate,
  ];

  constructor() {
    super(ItemType.Job);
  }

  public override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    forkJoin([
      this.jobService.getJobsByFilter(
        new PaginatedDataRequest(
          { ...requestObj?.filters, sorting: requestObj?.sorting },
          requestObj.maxResults,
          requestObj.firstResult,
        ),
      ),
      this.jobService.getJobCountByFilter(requestObj?.filters as JobFilter),
    ])
      .pipe(
        map(([items, count]) => ({
          count,
          items,
        })),
        take(1),
      )
      .subscribe(this.onDataLoad.bind(this));
  }

  canActivate() {
    return this.selectedRows.length === 1 && every(this.selectedRows, (row) => row.suspended);
  }

  canSuspend() {
    return this.selectedRows.length === 1 && every(this.selectedRows, (row) => !row.suspended);
  }

  canRetry() {
    return this.selectedRows.length > 0 && every(this.selectedRows, (row) => row?.retries === 0);
  }

  canDelete() {
    return this.selectedRows.length === 1;
  }

  canChangeDueDate() {
    return !isUndefined(this.selectedRows) && this.selectedRows.length === 1 && this.selectedRows[0].dueDate !== null;
  }

  async activate() {
    await this.confirmActionService.suspendOrActivateJob(
      [this.selectedRows[0].id],
      'Activate',
      this.selectedRows,
      () => {
        this.loadData();
      },
    );
  }

  async suspend() {
    await this.confirmActionService.suspendOrActivateJob(
      [this.selectedRows[0].id],
      'Suspend',
      this.selectedRows,
      () => {
        this.loadData();
      },
    );
  }

  async retry() {
    const ids = this.selectedRows.map((row) => row.id);
    await this.confirmActionService.retryJob(this.tenantId, ids, this.selectedRows, () => {
      this.loadData();
    });
  }

  async delete() {
    await this.confirmActionService.deleteJob(this.selectedRows[0].id, this.selectedRows, () => {
      this.loadData();
    });
  }

  async changeDueDate() {
    await this.confirmActionService.changeJobDueDate(this.selectedRows[0].id, this.selectedRows, () => {
      this.loadData();
    });
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
