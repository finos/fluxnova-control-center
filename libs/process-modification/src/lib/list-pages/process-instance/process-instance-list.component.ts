import { Component, inject, ViewChild } from '@angular/core';
import { every } from 'lodash-es';
import { forkJoin, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastService } from '@fxn/common';
import { ItemType, ItemTypeActions, ListOptions, ProcessInstanceStatesMap } from '@fxn/types';
import { getDefaultListViewState } from '../../common/list-utils';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { BaseListComponent } from '../base-list.component';
import { BatchService } from '../../services/support/batch.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-process-instance-list',
  templateUrl: './process-instance-list.component.html',
  styleUrls: ['./process-instance-list.component.scss'],
  standalone: false,
})
export class ProcessInstanceListComponent extends BaseListComponent {
  private processInstanceService = inject(ProcessInstanceService);
  private toastService = inject(ToastService);
  private batchService = inject(BatchService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;
  buttonPermissionsNeeded = [
    ItemTypeActions.SuspendProcessInstance,
    ItemTypeActions.ActivateProcessInstance,
    ItemTypeActions.TerminateProcessInstance,
  ];

  constructor() {
    super(ItemType.ProcessInstance);
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    forkJoin([
      this.processInstanceService.getProcessInstancesByFilter(
        new PaginatedDataRequest(
          {
            ...requestObj.filters,
            ...(requestObj.sorting && { sorting: requestObj.sorting }),
          },
          requestObj.maxResults,
          requestObj.firstResult,
        ),
      ),
      this.processInstanceService.getProcessInstanceHistoryCountByFilter(requestObj.filters),
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
    return (
      this.selectedRows.length &&
      every(this.selectedRows, (row) => row?.state === ProcessInstanceStatesMap.SUSPENDED.value)
    );
  }

  canSuspend() {
    return (
      this.selectedRows.length &&
      every(this.selectedRows, (row) => row?.state === ProcessInstanceStatesMap.ACTIVE.value)
    );
  }

  canTerminate() {
    return (
      this.selectedRows.length &&
      every(
        this.selectedRows,
        (row) =>
          row?.state === ProcessInstanceStatesMap.SUSPENDED.value ||
          row?.state === ProcessInstanceStatesMap.ACTIVE.value,
      )
    );
  }

  async suspendOrActivate(suspended = false) {
    const ids: string[] = this.selectedRows.map((row) => row.id);
    const servObs = await this.confirmActionService.suspendOrActivateInstance(this.tenantId, ids, suspended);

    servObs.pipe(take(1)).subscribe((res) => {
      if (!res || !res.canceled) {
        this.loadData();
      }
    });
  }

  async terminate() {
    const ids: string[] = this.selectedRows.map((row) => row.id);
    const servObs = await this.confirmActionService.terminateInstance(this.tenantId, ids);

    servObs.pipe(take(1)).subscribe((res) => {
      if (!res || !res.canceled) {
        this.loadData();
      }
    });
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
