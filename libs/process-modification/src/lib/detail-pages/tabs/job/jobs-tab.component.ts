import { Component, inject } from '@angular/core';
import { every, isUndefined } from 'lodash-es';
import {
  detailPageJobTabColFields,
  ItemTypeActions,
  Job,
  JobDefinition,
  predefinedDetailPageJobTabColDef,
  predefinedJobColDefs,
} from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { combineLatestWith, forkJoin, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { JobService } from '../../../services/job.service';
import { BaseTabComponent } from '../base-tab-component';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-jobs-tab',
  templateUrl: './jobs-tab.component.html',
  standalone: false,
})
export class JobsTabComponent extends BaseTabComponent {
  private jobService = inject(JobService);
  private confirmActionService = inject(ConfirmActionService);

  override columnDefinitions: ColDef<any, any>[] = detailPageJobTabColFields.map((colId: string) => ({
    colId,
    ...predefinedJobColDefs[colId],
    ...predefinedDetailPageJobTabColDef[colId],
    cellClass: 'pointer',
  }));

  override get tab(): PimTab {
    return PimTab.Jobs;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Jobs;
  }

  buttonPermissionsNeeded = [ItemTypeActions.ActivateJob, ItemTypeActions.SuspendJob, ItemTypeActions.SetJobRetryCount];

  override get dataFilter(): any {
    return {
      processInstanceId: this.detailItemId,
      sorting: [
        {
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
        },
      ],
      ...(this.route.snapshot.queryParams.filteredActivityId
        ? { activityId: this.route.snapshot.queryParams.filteredActivityId }
        : {}),
      ...this.userSuppliedFilters,
    };
  }

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataService(new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult))
      .pipe(combineLatestWith(this.eventBus.diagramRendered$))
      .subscribe({
        next: ([data, diagramRendered]: [any[], boolean]) => {
          if (diagramRendered) {
            this.onDataLoad(data as any[]);
          }
        },
        error: (error: any) => this.onDataLoadFailed(error),
      });
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.jobService.getJobsByFilter(request).pipe(
      switchMap((jobs) =>
        forkJoin([
          of(jobs),
          // This forkJoin/map is because each call returns an array of job definitions.
          // We want to flatten it because we know each array will only have one element.
          jobs.length > 0
            ? forkJoin(
                jobs.map((job) =>
                  this.jobService
                    .getJobDefinitionsByFilter(new PaginatedDataRequest({ jobDefinitionId: job.jobDefinitionId }, 1))
                    .pipe(map((jobDefinitions) => ({ ...jobDefinitions[0] }))),
                ),
              )
            : of([]),
        ]),
      ),
      map(([jobs, jobDefinitions]: [Job[], JobDefinition[]]) => {
        const jobDefinitionObject: any = {};
        jobDefinitions.forEach((definition: JobDefinition) => {
          if (definition.id) jobDefinitionObject[definition.id] = definition.activityId;
        });
        return jobs.map((job) => ({
          ...job,
          activityId: job.jobDefinitionId && jobDefinitionObject[job.jobDefinitionId],
        }));
      }),
    );
  }

  canActivate() {
    return (
      !isUndefined(this.selectedRows) &&
      this.selectedRows.length > 0 &&
      every(this.selectedRows, (row) => row.suspended)
    );
  }

  canSuspend() {
    return (
      !isUndefined(this.selectedRows) &&
      this.selectedRows.length > 0 &&
      every(this.selectedRows, (row) => !row.suspended)
    );
  }

  canRetry() {
    return (
      !isUndefined(this.selectedRows) &&
      this.selectedRows.length > 0 &&
      every(this.selectedRows, (row) => row?.retries === 0)
    );
  }

  canChangeDueDate() {
    return !isUndefined(this.selectedRows) && this.selectedRows.length === 1 && this.selectedRows[0].dueDate !== null;
  }

  async activate() {
    const jobIds = this.selectedRows.map((row) => row.id);
    if (jobIds) {
      await this.confirmActionService.suspendOrActivateJob(jobIds, 'Activate', this.selectedRows, () => {
        this.loadData();
        this.resetUrl();
      });
    }
  }

  async suspend() {
    const jobIds = this.selectedRows.map((row) => row.id);
    if (jobIds) {
      await this.confirmActionService.suspendOrActivateJob(jobIds, 'Suspend', this.selectedRows, () => {
        this.loadData();
        this.resetUrl();
      });
    }
  }

  async retry() {
    const jobIds = this.selectedRows.map((row) => row.id);
    if (jobIds) {
      await this.confirmActionService.retryJob(this.tenantId, jobIds, this.selectedRows, () => {
        this.loadData();
        this.resetUrl();
      });
    }
  }

  async changeDueDate() {
    const jobId = this.selectedRows[0].id;
    if (jobId) {
      await this.confirmActionService.changeJobDueDate(jobId, this.selectedRows, () => {
        this.loadData();
        this.resetUrl();
      });
    }
  }
}
