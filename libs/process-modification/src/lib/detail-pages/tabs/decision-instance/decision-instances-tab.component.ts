import { Component, inject, Input } from '@angular/core';
import { decisionInstanceAllColsColDefs, decisionInstanceDefaultColDefs, ItemType } from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { BaseTabComponent } from '../base-tab-component';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { NeedsParentInfo } from '../../NeedsParentInfo';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-decision-instance-list',
  templateUrl: './decision-instances-tab.component.html',
  styleUrls: ['./decision-instances-tab.component.scss'],
  standalone: false,
})
export class DecisionInstancesTabComponent extends BaseTabComponent implements NeedsParentInfo {
  decisionInstanceService = inject(DecisionInstanceService);

  @Input()
  parentItemType: ItemType = ItemType.DecisionDefinition;

  protected readonly PimTab = PimTab;
  protected readonly ItemType = ItemType;

  override columnDefinitions: ColDef[] = [];

  override get tab(): PimTab {
    return PimTab.DecisionInstances;
  }

  override get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.DecisionInstances;
  }

  override get dataFilter(): any {
    const filters = { ...this.userSuppliedFilters };

    if ('activityId' in filters) {
      filters.activityIdIn = [filters.activityId];
      delete filters.activityId;
    }

    return {
      [this.getParentItemKeyName()]: this.detailItemId,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...(this.route.snapshot.queryParams.filteredActivityId
        ? { activityId: this.route.snapshot.queryParams.filteredActivityId }
        : {}),
      ...filters,
    };
  }

  override dataService(request: PaginatedDataRequest): any {
    return this.decisionInstanceService.getDecisionInstanceList(request);
  }

  override async init() {
    this.columnDefinitions = this.getColumnDefinitionsForItemType(this.parentItemType);
    await super.init();
  }

  public getParentItemKeyName(): string {
    switch (this.parentItemType) {
      case ItemType.DecisionDefinition:
        return 'decisionDefinitionId';
      case ItemType.ProcessDefinition:
        return 'processDefinitionId';
      case ItemType.ProcessInstance:
        return 'processInstanceId';
    }
    return '';
  }

  private getColumnDefinitionsForItemType(itemType: ItemType) {
    const definitions =
      itemType === ItemType.DecisionDefinition ? decisionInstanceAllColsColDefs : decisionInstanceDefaultColDefs;

    const columnDefinitions = Object.keys(definitions).map((colId) => ({
      colId,
      ...definitions[colId],
    }));

    return columnDefinitions;
  }
}
