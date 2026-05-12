import { Component, inject, ViewChild } from '@angular/core';
import { ItemType, ListOptions } from '@fxn/types';
import { take } from 'rxjs';
import { getDefaultListViewState } from '../../common/list-utils';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { BaseListComponent } from '../base-list.component';
import { DecisionDefinitionService } from '../../services/decision-definition.service';

import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-decision-definition-list',
  templateUrl: './decision-definition-list.component.html',
  styleUrls: ['./decision-definition-list.component.scss'],
  standalone: false,
})
export class DecisionDefinitionListComponent extends BaseListComponent {
  private decisionDefinitionService = inject(DecisionDefinitionService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;

  constructor() {
    super(ItemType.DecisionDefinition);
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    this.decisionDefinitionService
      .getDecisionDefinitions(
        new PaginatedDataRequest(
          JSON.parse(
            JSON.stringify({
              ...requestObj.filters,
              sortBy: requestObj.sorting?.[0].sortBy,
              sortOrder: requestObj.sorting?.[0].sortOrder,
            }),
          ),
          requestObj.maxResults,
          requestObj.firstResult,
        ),
      )
      .pipe(take(1))
      .subscribe(this.onDataLoad.bind(this));
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
