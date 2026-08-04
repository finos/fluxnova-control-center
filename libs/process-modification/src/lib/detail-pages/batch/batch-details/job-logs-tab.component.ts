import { Component } from '@angular/core';
import { jobLogColFields, predefinedDetailPageJobLogTabColDef } from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { PimTab } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { BaseBatchDetailsTabComponent } from './base-batch-details-tab.component';

@Component({
  selector: 'fluxnova-job-logs-tab',
  template: `
    <fluxnova-tab-actions-floating-container
      [showResetGridButton]="showResetGridButton"
      (resetGridClicked)="onResetGridClick()"
    />
    <fluxnova-items-table
      data-table-role="result"
      [items]="data"
      [filters]="filters"
      [sorting]="sorting"
      [overlayNoRowsTemplate]="overlayNoRowsTemplate"
      [isLoading]="isLoading"
      [isRowSelectable]="isRowSelectable"
      [checkboxes]="false"
      [rowSelectionType]="'singleRow'"
      [listViewState]="listViewState"
      (gridReady)="onGridReady()"
      (columnHeaderSortChange)="onSortChanged($event)"
      (columnHeaderFilterChange)="onFilterChanged($event)"
      (rowClicked)="onRowClick($event)"
      (firstDataRendered)="onFirstDataRendered()"
      [highlightedActivityId]="highlightedActivityId"
      (listViewStateChange)="columnPrefsUpdated($event)"
    >
    </fluxnova-items-table>

    <fluxnova-ag-pagination
      class="border-top align-items-center px-3"
      [totalItems]="totalCount"
      [loading]="isLoading"
      (paginationChanged)="paginationSubject$.next({ page: $event.page, pageSize: $event.pageSize })"
    ></fluxnova-ag-pagination>
  `,
  styleUrls: ['./job-logs-tab.component.scss'],
  standalone: false,
})
export class JobLogsTabComponent extends BaseBatchDetailsTabComponent {
  override columnDefinitions: ColDef<any, any>[] = jobLogColFields.map((colId: string) => ({
    colId,
    ...predefinedDetailPageJobLogTabColDef[colId],
    floatingFilter: false,
  }));

  override get tab(): PimTab {
    return PimTab.JobLogs;
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.jobService.getJobLogsByFilter(request);
  }
}
