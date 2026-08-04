import { ColDef, IRowNode } from 'ag-grid-community';
import { Component, inject, Input, OnDestroy } from '@angular/core';
import {
  inputOutputColDefs,
  inputOutputColFields,
} from '@fxn/types/src/grid/predefined-input-output-column-definitions';
import { DecisionInstance, noFilterNoSortColDef } from '@fxn/types';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { BaseTabComponent } from '../base-tab-component';

import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-input-output-tab',
  templateUrl: './input-output-tab.component.html',
  styleUrls: [],
  standalone: false,
})
export class InputOutputTabComponent extends BaseTabComponent implements OnDestroy {
  decisionInstanceService = inject(DecisionInstanceService);

  override columnDefinitions: ColDef[] = inputOutputColFields.map((colId: string) => ({
    colId,
    ...inputOutputColDefs[colId],
    ...noFilterNoSortColDef,
  }));

  @Input() showType = '';

  override get tab(): PimTab {
    return this.showType === PimTab.Inputs ? PimTab.Inputs : PimTab.Outputs;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Undefined;
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.decisionInstanceService.getInstance(request.filter.decisionInstanceId);
  }

  override loadData(filter: any = this.dataFilter): void {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(new PaginatedDataRequest({ decisionInstanceId: filter }, 1)).subscribe({
      next: (result: DecisionInstance) =>
        this.onDataLoad(this.tab === PimTab.Inputs ? (result.inputs ?? []) : (result.outputs ?? [])),
      error: (error: any) => this.onDataLoadFailed(error),
    });
  }

  override onDataLoad(data: any[]) {
    super.onDataLoad(data);

    this.totalCount = data.length;
  }

  override isRowSelectable(row: IRowNode<DecisionInstance>): boolean {
    return !super.isRowSelectable(row);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }
}
