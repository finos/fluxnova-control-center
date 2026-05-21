import { Component, inject, ViewChild } from '@angular/core';
import { take } from 'rxjs';
import { ItemType, ItemTypeActions, ListOptions } from '@fxn/types';
import { getDefaultListViewState } from '../../common/list-utils';
import { BaseListComponent } from '../base-list.component';
import { DeploymentService } from '../../services/deployment.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.scss'],
  standalone: false,
})
export class DeploymentListComponent extends BaseListComponent {
  private deployments = inject(DeploymentService);

  @ViewChild('itemsTable')
  itemsTable?: ItemsTableComponent;
  buttonPermissionsNeeded = [ItemTypeActions.DeleteDeployment];

  constructor() {
    super(ItemType.Deployment);
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    this.deployments
      .getDeployments(
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

  canDelete() {
    return this.selectedRows.length;
  }

  async delete() {
    await this.confirmActionService.deleteDeployment([this.selectedRows[0].id], () => {
      this.loadData();
    });
  }

  public override resetColumns() {
    super.resetColumns();
    this.itemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType));
  }
}
