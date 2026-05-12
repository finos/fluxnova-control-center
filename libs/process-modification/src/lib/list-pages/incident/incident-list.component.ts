import { Component, inject, ViewChild } from '@angular/core';
import { forkJoin, take, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType, ItemTypeActions, ListOptions } from '@fxn/types';
import { getDefaultListViewState } from '../../common/list-utils';
import { BaseListComponent } from '../base-list.component';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { IncidentService } from '../../services/incident.service';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.scss'],
  standalone: false,
})
export class IncidentListComponent extends BaseListComponent {
  private incidentService = inject(IncidentService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;

  retryTooltip = 'Set Retry Count';
  buttonPermissionsNeeded = [ItemTypeActions.SetJobRetryCount];

  constructor() {
    super(ItemType.Incident);
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    forkJoin([
      this.incidentService.getIncidentsByFilterAndPagination(
        new PaginatedDataRequest(
          {
            ...requestObj.filters,
            sortBy: requestObj.sorting?.[0].sortBy,
            sortOrder: requestObj.sorting?.[0].sortOrder,
          },
          requestObj.maxResults,
          requestObj.firstResult,
        ),
      ),
      this.incidentService.getIncidentCountByFilter(requestObj.filters || {}),
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
    const ids = this.selectedRows.map((row) => row.configuration); // Configuration is the Job Id
    const lineItems = this.selectedRows;
    await this.confirmActionService.retryJob(this.tenantId, ids, lineItems, () => {
      this.loadData();
    });
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
