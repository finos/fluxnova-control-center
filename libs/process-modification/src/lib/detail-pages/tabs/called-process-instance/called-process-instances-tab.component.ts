import { Component, inject } from '@angular/core';
import {
  detailCalledProcessInstancesTabColFields,
  predefinedCalledInstanceTabColDefs,
  ProcessInstance,
} from '@fxn/types';
import { combineLatestWith, delay } from 'rxjs';
import { BaseTabComponent } from '../base-tab-component';
import { CalledProcessInstancesService } from '../../../services/called-process-instances.service';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-static-called-process-instances',
  templateUrl: './called-process-instances-tab.component.html',
  styleUrls: ['./called-process-instances-tab.component.scss'],
  standalone: false,
})
export class CalledProcessInstancesTabComponent extends BaseTabComponent {
  private staticCalledProcessInstancesService = inject(CalledProcessInstancesService);

  override get dataFilter() {
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

  override dataService(request: PaginatedDataRequest): any {
    return this.staticCalledProcessInstancesService.getRowDataList(request);
  }

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(
      new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult),
    )
      .pipe(combineLatestWith(this.eventBus.diagramRendered$), delay(1))
      .subscribe({
        next: ([data, diagramRendered]: [ProcessInstance[], boolean]) => {
          if (diagramRendered) {
            this.onDataLoad(data as any[]);
          }
        },
        error: (error: any) => this.onDataLoadFailed(error),
      });
  }

  override columnDefinitions = detailCalledProcessInstancesTabColFields.map((colId: string) => ({
    colId,
    ...predefinedCalledInstanceTabColDefs[colId],
    cellClass: 'pointer',
  }));

  override get tab() {
    return PimTab.CalledProcessInstances;
  }

  override get rowItemQueryParam() {
    return PimTabRowQueryParam.CalledProcessInstances;
  }
}
