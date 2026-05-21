import { Component, inject, OnDestroy } from '@angular/core';
import { detailPageHistoryTabColFields, noFilterNoSortColDef, predefinedHistoryColDefs } from '@fxn/types';
import { IsFullWidthRowParams, RowClickedEvent } from 'ag-grid-community';
import { catchError, map } from 'rxjs/operators';
import { noRowsTemplate } from '@fxn/grid';
import { of } from 'rxjs';
import { BaseTabComponent } from '../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { HistoryTabService } from './history-tab.service';

@Component({
  selector: 'fluxnova-history-tab',
  templateUrl: './history-tab.component.html',
  styleUrls: ['./history-tab.component.scss'],
  standalone: false,
})
export class HistoryTabComponent extends BaseTabComponent implements OnDestroy {
  private processInstanceService = inject(ProcessInstanceService);
  private historyTabService = inject(HistoryTabService);

  processInstanceId?: string;
  selectedHistoryTypes?: { label: string; value: string }[] = [];
  columnDefinitions = detailPageHistoryTabColFields.map((colId: string) => ({
    colId,
    ...predefinedHistoryColDefs[colId],
    cellClass: 'pointer',
    ...noFilterNoSortColDef,
  }));
  historyTypeOptions = [
    {
      label: 'Activity Instance',
      value: 'activityInstance',
    },
    { label: 'Detail', value: 'detail' },
    {
      label: 'Incident',
      value: 'incident',
    },
    { label: 'User Operation', value: 'userOperation' },
  ];
  isLoadAll = false;
  typeFilters: string[] = [];

  get tab(): PimTab {
    return PimTab.History;
  }

  get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.History;
  }

  dataService(request: PaginatedDataRequest): any {
    return this.processInstanceService
      .getFullHistory(this.detailItemId ?? '', request?.filter.typeFilters ?? [], request?.filter.isLoadAll ?? false)
      .pipe(
        map((resp) =>
          this.historyTabService.combineAndOrderHistoryData(
            resp?.userOperation,
            resp?.detail,
            resp?.activityInstance,
            resp?.incident,
          ),
        ),
        catchError((error: any) => {
          this.toastService?.error(error.message);
          this.isLoading = false;
          return of([]);
        }),
      );
  }

  override get dataFilter() {
    return {
      isLoadAll: this.isLoadAll,
      typeFilters: this.typeFilters,
    };
  }

  override async onRowClick(event: RowClickedEvent) {
    const isRowForLoadAllRows = event?.data?.id === 'loadAllButton';

    if (isRowForLoadAllRows) {
      this.onLoadAllRowsRowClick();
    } else {
      await super.onRowClick(event);
    }
  }

  private onLoadAllRowsRowClick() {
    this.isLoadAll = true;
    this.loadData();
  }

  override get overlayNoRowsTemplate(): string {
    return noRowsTemplate('history items');
  }

  onApiTypeChange(event: { label: string; value: string }[]) {
    const e = event as { label: string; value: string }[];
    this.selectedHistoryTypes = e;
    this.typeFilters = e?.map((filter) => filter.value);

    this.eventBus.tabFilterUpdated({
      tab: PimTab.History,
      filter: this.dataFilter,
    });

    this.loadData();
  }

  onFirstDataRendered() {
    if (this.selectedItemId) {
      this.agGrid?.api.forEachNode((node) => node.setSelected(node.data?.id === this.selectedItemId));
    }
  }

  isFullWidthRow(params: IsFullWidthRowParams) {
    return params.rowNode.data.id === 'loadAllButton';
  }
}
