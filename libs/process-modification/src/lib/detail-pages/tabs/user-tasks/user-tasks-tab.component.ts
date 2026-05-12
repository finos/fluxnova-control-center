import { ColDef, RowClassParams, RowClickedEvent } from 'ag-grid-community';
import { Component, inject, OnDestroy } from '@angular/core';
import { predefinedUserTaskColDefs, predefinedUserTaskColFields } from '@fxn/types';
import { UserTaskService } from '../../../services/user-task.service';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { BaseTabComponent } from '../base-tab-component';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-user-tasks-tab',
  templateUrl: './user-tasks-tab.component.html',
  standalone: false,
})
export class UserTasksTabComponent extends BaseTabComponent implements OnDestroy {
  private userTaskService = inject(UserTaskService);

  override get dataFilter(): any {
    return {
      processInstanceId: this.detailItemId,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...(this.route.snapshot.queryParams.filteredActivityId
        ? { activityId: this.route.snapshot.queryParams.filteredActivityId }
        : {}),
      ...this.userSuppliedFilters,
    };
  }

  override columnDefinitions: ColDef<any, any>[] = predefinedUserTaskColFields.map((colId: string) => ({
    colId,
    ...predefinedUserTaskColDefs[colId],
    cellClass: 'pointer',
  }));

  override async onRowClick(event: RowClickedEvent) {
    const clickedSameRow =
      event.data?.taskDefinitionKey === this.highlightedActivityId && event.data?.id === this.selectedItemId;
    if (event.data?.taskDefinitionKey) {
      this.eventBus.rowClickedWithActivity(event.data?.taskDefinitionKey);
    }
    await this.router.navigate([], {
      replaceUrl: true,
      queryParams: {
        activityId: clickedSameRow ? undefined : event.data?.taskDefinitionKey,
        [this.rowItemQueryParam]: clickedSameRow ? undefined : event.data?.id,
        filteredActivityId: this.route.snapshot.queryParams.filteredActivityId,
        tab: this.tab.toLowerCase(),
      },
    });
  }

  override rowClassRules = () => ({
    'row-highlighted': (params: RowClassParams) =>
      params?.data?.taskDefinitionKey === this.highlightedActivityId && params?.data?.id === this.selectedItemId,
  });

  protected override get activityColumnKey(): string {
    return 'taskDefinitionKey';
  }

  override get tab(): PimTab {
    return PimTab.UserTasks;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.UserTasks;
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.userTaskService.getUserTasksByFilter(request);
  }
}
