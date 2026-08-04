import { Component, inject, Input, OnDestroy } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import {
  detailPageIncidentTabColFields,
  Incident,
  IncidentsFilter,
  ItemType,
  ItemTypeActions,
  predefinedIncidentTabColDefs,
  predefinedIncidentTabPInstColDefs,
} from '@fxn/types';
import { combineLatestWith, take, timer } from 'rxjs';
import { NeedsParentInfo } from '../../NeedsParentInfo';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { IncidentService } from '../../../services/incident.service';
import { BaseTabComponent } from '../base-tab-component';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-incidents-tab',
  templateUrl: './incidents-tab.component.html',
  standalone: false,
})
export class IncidentsTabComponent extends BaseTabComponent implements NeedsParentInfo, OnDestroy {
  private incidentService = inject(IncidentService);
  private confirmActionService = inject(ConfirmActionService);

  override columnDefinitions: ColDef[] = [];

  override get tab(): PimTab {
    return PimTab.Incidents;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Incidents;
  }

  override get dataFilter() {
    const itemTypeFormatted = `${this.parentItemType.slice(0, 1).toLowerCase()}${this.parentItemType.slice(1)}`;
    const keyForFilter = `${itemTypeFormatted}Id`;

    return {
      [keyForFilter]: this.detailItemId,
      open: true,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...(this.route.snapshot.queryParams.filteredActivityId
        ? { activityId: this.route.snapshot.queryParams.filteredActivityId }
        : {}),
      ...this.userSuppliedFilters,
    } as IncidentsFilter;
  }

  buttonPermissionsNeeded = [ItemTypeActions.SetJobRetryCount];

  @Input()
  parentItemType: ItemType = ItemType.ProcessInstance;
  retryTooltip = 'Set Retry Count';

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(
      new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult),
    )
      .pipe(combineLatestWith(this.eventBus.diagramRendered$))
      .subscribe({
        next: ([data, diagramRendered]: [Incident[], boolean]) => {
          if (diagramRendered) {
            this.onDataLoad(data as any[]);
          }
        },
        error: (error: any) => this.onDataLoadFailed(error),
      });
  }

  override async init() {
    this.columnDefinitions = detailPageIncidentTabColFields.map((colId: string) => {
      const defs =
        this.parentItemType === ItemType.ProcessDefinition
          ? predefinedIncidentTabColDefs
          : predefinedIncidentTabPInstColDefs;
      return {
        colId,
        ...defs[colId],
      };
    });
    await super.init();
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.incidentService.getIncidentsByFilterAndPagination(request);
  }

  canRetry() {
    const noAssociatedJobId = this.selectedRows.some((row) => row.jobDefinitionId == null);

    const expectedTooltipValue = noAssociatedJobId
      ? 'No associated job found for 1 or more selected incidents'
      : 'Set Retry Count';

    if (expectedTooltipValue !== this.retryTooltip) {
      timer(0)
        .pipe(take(1))
        .subscribe(() => {
          this.retryTooltip = expectedTooltipValue;
        }); // This crazy statement is needed to avoid the "ExpressionChangedAfterItHasBeenChecked" Angular Error
    }

    return this.selectedRows.length > 0 && !noAssociatedJobId;
  }

  async retry() {
    const jobIds = this.selectedRows.map((row) => row.configuration); // Configuration is the Job Id
    const lineItems = this.selectedRows;
    if (jobIds) {
      await this.confirmActionService.retryJob(this.tenantId, jobIds, lineItems, () => {
        this.loadData();
        this.sendFilterChangedNotification();
        this.resetUrl();
      });
    }
  }
}
