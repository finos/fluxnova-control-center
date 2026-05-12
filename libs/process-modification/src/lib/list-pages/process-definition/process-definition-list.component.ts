import { Component, inject, ViewChild } from '@angular/core';
import { every } from 'lodash-es';
import { forkJoin, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType, ItemTypeActions, ListOptions } from '@fxn/types';
import { getDefaultListViewState } from '../../common/list-utils';
import { ProcessDefinitionService } from '../../services/process-definition.service';
import { BaseListComponent } from '../base-list.component';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-process-list',
  templateUrl: './process-definition-list.component.html',
  styleUrls: ['./process-definition-list.component.scss'],
  standalone: false,
})
export class ProcessDefinitionListComponent extends BaseListComponent {
  private processDefinitionService = inject(ProcessDefinitionService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;
  buttonPermissionsNeeded = [
    ItemTypeActions.ActivateProcessDefinition,
    ItemTypeActions.SuspendProcessDefinition,
    ItemTypeActions.DeleteProcessDefinition,
  ];

  constructor() {
    super(ItemType.ProcessDefinition);
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    forkJoin([
      this.processDefinitionService.getProcessDefinitionsByFilter(
        new PaginatedDataRequest(
          {
            ...requestObj?.filters,
            // The process definition endpoints require the sorting parameters in a different
            // structure than what is returned by mappedQueryParamsOptions.
            sortBy: requestObj.sorting?.[0].sortBy,
            sortOrder: requestObj.sorting?.[0].sortOrder,
          },
          requestObj.maxResults,
          requestObj.firstResult,
        ),
      ),
      this.processDefinitionService.getProcessDefinitionCountByFilter(requestObj.filters),
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
    return this.selectedRows.length && every(this.selectedRows, (row) => row.suspended);
  }

  canSuspend() {
    return this.selectedRows.length && every(this.selectedRows, (row) => !row.suspended);
  }

  canDelete() {
    return this.selectedRows.length;
  }

  async activate() {
    await this.confirmActionService.activateOrSuspendDefinition([this.selectedRows[0].id], 'Activate', () => {
      this.loadData();
    });
  }

  async suspend() {
    await this.confirmActionService.activateOrSuspendDefinition([this.selectedRows[0].id], 'Suspend', () => {
      this.loadData();
    });
  }

  async delete() {
    await this.confirmActionService.deleteDefinition([this.selectedRows[0].id], () => {
      this.loadData();
    });
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
