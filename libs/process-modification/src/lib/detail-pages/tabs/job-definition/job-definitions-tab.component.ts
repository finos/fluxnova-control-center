import { Component, EventEmitter, inject, Output } from '@angular/core';
import {
  detailPageJobDefinitionTabColFields,
  ItemTypeActions,
  JobDefinition,
  JobDefinitionFilter,
  predefinedJobDefinitionColDefs,
} from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { combineLatestWith } from 'rxjs';
import { every, isUndefined } from 'lodash-es';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { BaseTabComponent } from '../base-tab-component';
import { JobService } from '../../../services/job.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-job-definitions-tab',
  templateUrl: './job-definitions-tab.component.html',
  standalone: false,
})
export class JobDefinitionsTabComponent extends BaseTabComponent {
  private jobService = inject(JobService);
  private confirmActionService = inject(ConfirmActionService);

  @Output() jobDefSuspensionChanged = new EventEmitter();

  get processDefinitionId(): string {
    return this.detailItemId ?? '';
  }

  override get dataFilter(): JobDefinitionFilter {
    return {
      processDefinitionId: this.processDefinitionId,
      ...(this.route.snapshot.queryParams.filteredActivityId
        ? { activityIdIn: [this.route.snapshot.queryParams.filteredActivityId] }
        : {}),
    };
  }

  override columnDefinitions: ColDef<any, any>[] = detailPageJobDefinitionTabColFields.map((colId: string) => ({
    colId,
    ...predefinedJobDefinitionColDefs[colId],
    cellClass: 'pointer',
  }));

  override get tab(): PimTab {
    return PimTab.JobDefinitions;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.JobDefinitions;
  }

  buttonPermissionsNeeded = [
    ItemTypeActions.ActivateJobDefinition,
    ItemTypeActions.SuspendJobDefinition,
    ItemTypeActions.ChangeJobDefinitionPriority,
  ];

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(
      new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult),
    )
      .pipe(combineLatestWith(this.eventBus.diagramRendered$))
      .subscribe({
        next: ([data, diagramRendered]: [JobDefinition[], boolean]) => {
          if (diagramRendered) {
            this.onDataLoad(data as any[]);
          }
        },
        error: (error: any) => {
          this.onDataLoadFailed(error);
        },
      });
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.jobService.getJobDefinitionsByFilter(request);
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

  canSetPriority() {
    return !isUndefined(this.selectedRows) && this.selectedRows.length === 1;
  }

  async activate() {
    const jobIds = this.selectedRows.map((row) => row.id);
    const activityIds = this.selectedRows.map((row) => row.activityId);
    if (jobIds) {
      await this.confirmActionService.suspendOrActivateJobDefinition(
        jobIds,
        'Activate',
        this.selectedRows,
        (delayed: boolean) => {
          this.loadData();
          this.resetUrl();
          if (!delayed) {
            this.jobDefSuspensionChanged.emit({
              activityIds,
              suspended: false,
            });
          }
        },
      );
    }
  }

  async suspend() {
    const jobIds = this.selectedRows.map((row) => row.id);
    const activityIds = this.selectedRows.map((row) => row.activityId);
    if (jobIds) {
      await this.confirmActionService.suspendOrActivateJobDefinition(
        jobIds,
        'Suspend',
        this.selectedRows,
        (delayed: boolean) => {
          this.loadData();
          this.resetUrl();
          if (!delayed) {
            this.jobDefSuspensionChanged.emit({
              activityIds,
              suspended: true,
            });
          }
        },
      );
    }
  }

  async setPriority() {
    const row = this.selectedRows[0];
    if (row) {
      await this.confirmActionService.setJobDefinitionPriority(
        row.id,
        [row],
        row.overridingJobPriority !== null,
        () => {
          this.loadData();
          this.resetUrl();
        },
      );
    }
  }
}
