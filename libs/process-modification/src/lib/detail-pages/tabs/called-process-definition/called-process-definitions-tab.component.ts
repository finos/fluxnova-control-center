import { Component, inject } from '@angular/core';
import {
  CalledProcessDefinition,
  CalledProcessDefinitionFilter,
  predefinedStaticCalledProcessDefColFields,
  predefinedStaticCalledProcessDefinitionColDefs,
} from '@fxn/types';
import { noRowsTemplate } from '@fxn/grid';
import { combineLatestWith } from 'rxjs';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { BaseTabComponent } from '../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-called-process-definitions',
  templateUrl: './called-process-definitions-tab.component.html',
  standalone: false,
})
export class CalledProcessDefinitionsTabComponent extends BaseTabComponent {
  private processDefinitionService = inject(ProcessDefinitionService);

  override columnDefinitions = predefinedStaticCalledProcessDefColFields.map((colId: string) => ({
    colId,
    ...predefinedStaticCalledProcessDefinitionColDefs[colId],
    cellClass: 'pointer',
  }));

  override get overlayNoRowsTemplate(): string {
    return noRowsTemplate('called process definitions');
  }

  get tab(): PimTab {
    return PimTab.CalledProcessDefinitions;
  }

  get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.CalledProcessDefinitions;
  }

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(
      new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult),
    )
      .pipe(combineLatestWith(this.eventBus.diagramRendered$))
      .subscribe({
        next: ([data, diagramRendered]: [CalledProcessDefinition[], boolean]) => {
          if (diagramRendered) {
            this.onDataLoad(data as any[]);
          }
        },
        error: (error: any) => this.onDataLoadFailed(error),
      });
  }

  override selectRow(id?: string, property: string = 'calledProcessDefinitionId') {
    return super.selectRow(id, property);
  }

  dataService(request: PaginatedDataRequest<CalledProcessDefinitionFilter>): any {
    return this.processDefinitionService.getCalledProcessDefinitions(request);
  }

  override get dataFilter(): CalledProcessDefinitionFilter {
    return {
      processDefinitionId: this.detailItemId ?? '',
      unfinished: true,
      activityId: this.route.snapshot.queryParams.filteredActivityId,
    };
  }
}
