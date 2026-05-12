import { Component, OnDestroy } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { predefinedJobColDefs, remainingJobColFields } from '@fxn/types';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { BaseBatchDetailsTabComponent } from './base-batch-details-tab.component';

@Component({
  selector: 'fluxnova-remaining-jobs-tab',
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
  styleUrls: ['./remaining-jobs-tab.component.scss'],
  standalone: false,
})
export class RemainingJobsTabComponent extends BaseBatchDetailsTabComponent implements OnDestroy {
  override columnDefinitions: ColDef<any, any>[] = remainingJobColFields.map((colId: string) => ({
    colId,
    ...predefinedJobColDefs[colId],
    floatingFilter: false,
  }));

  override get tab(): PimTab {
    return PimTab.RemainingJobs;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Jobs;
  }

  override get dataFilter(): any {
    return {
      jobDefinitionId: this.detailItemId,
      sorting: [
        {
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
        },
      ],
      ...this.userSuppliedFilters,
    };
  }
}
