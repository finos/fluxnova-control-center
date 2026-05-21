import { Component, inject, ViewChild } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { Params } from '@angular/router';
import { isEmpty } from 'lodash-es';
import { top } from '@popperjs/core';
import {
  ItemType,
  ItemTypeActions,
  ListOptions,
  ListViewState,
  LocalStorageColumnPrefData,
  SubItemType,
} from '@fxn/types';
import { BaseListComponent } from '../base-list.component';
import { BatchService } from '../../services/support/batch.service';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import {
  getDefaultListViewState,
  haveColumnStatesDeviatedFromDefault,
  mergeSavedStateWithColumnDefinitions,
} from '../../common/list-utils';
import { getDataSavedInLocalStorage, saveDataToLocalStorage } from '../../common/storage-utils';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-batch-list',
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.scss'],
  standalone: false,
})
export class BatchListComponent extends BaseListComponent {
  private batchService = inject(BatchService);

  @ViewChild('activeItemsTable')
  activeItemsTable?: ItemsTableComponent;

  @ViewChild('completedItemsTable')
  completedItemsTable?: ItemsTableComponent;

  modifyBatches$?: Subscription;
  showCompletedBatches = false;
  activeColumnPreferences: ListViewState = getDefaultListViewState(this.itemType, SubItemType.Active);
  completedColumnPreferences: ListViewState = getDefaultListViewState(this.itemType, SubItemType.Completed);
  buttonPermissionsNeeded = [
    ItemTypeActions.DeleteBatch,
    ItemTypeActions.SetJobRetryCount,
    ItemTypeActions.ActivateBatch,
    ItemTypeActions.SuspendBatch,
  ];

  LIST_VIEW_STATE_STORAGE_KEY_ACTIVE = `${this.itemType}-list-active.listViewState`;
  LIST_VIEW_STATE_STORAGE_KEY_COMPLETED = `${this.itemType}-list-completed.listViewState`;

  get BATCH_LIST_VIEW_STORAGE_KEY() {
    return this.showCompletedBatches
      ? this.LIST_VIEW_STATE_STORAGE_KEY_COMPLETED
      : this.LIST_VIEW_STATE_STORAGE_KEY_ACTIVE;
  }

  constructor() {
    super(ItemType.Batch);

    this.initListViewState();
  }

  /**
   * Initialize the list view state for active and completed batches.
   */
  initListViewState() {
    const savedActive = getDataSavedInLocalStorage<LocalStorageColumnPrefData>(this.LIST_VIEW_STATE_STORAGE_KEY_ACTIVE);
    const savedCompleted = getDataSavedInLocalStorage<LocalStorageColumnPrefData>(
      this.LIST_VIEW_STATE_STORAGE_KEY_COMPLETED,
    );

    this.hasListViewStateDeviatedFromDefault = this.showCompletedBatches
      ? (savedCompleted.differentThanDefaults ?? false)
      : (savedActive.differentThanDefaults ?? false);

    this.activeColumnPreferences = !isEmpty(savedActive)
      ? mergeSavedStateWithColumnDefinitions(savedActive.columnState, this.itemType, SubItemType.Active)
      : getDefaultListViewState(this.itemType, SubItemType.Active);
    this.completedColumnPreferences = !isEmpty(savedCompleted)
      ? mergeSavedStateWithColumnDefinitions(savedCompleted.columnState, this.itemType, SubItemType.Completed)
      : getDefaultListViewState(this.itemType, SubItemType.Completed);
  }

  override setDataLoadParams(queryParams: Params): void {
    super.setDataLoadParams(queryParams);
    this.showCompletedBatches = this.queryParams.showCompleted === 'true';
  }

  override loadData() {
    super.loadData();

    const requestObj: ListOptions = this.getMappedLoadOptions();

    const params = JSON.parse(
      JSON.stringify({
        ...requestObj.filters,
        sortBy: requestObj.sorting?.[0].sortBy,
        sortOrder: requestObj.sorting?.[0]?.sortOrder,
      }),
    );
    const request = new PaginatedDataRequest(params, requestObj.maxResults, requestObj.firstResult);

    const obs = this.showCompletedBatches
      ? this.batchService.getCompletedBatches(request)
      : this.batchService.getActiveBatches(request);

    obs.pipe(take(1)).subscribe(this.onDataLoad.bind(this));
  }

  override onDataLoad(results: any) {
    super.onDataLoad(results);
    this.data = results.items.map((item: any) => ({
      ...item,
      batchId: item.id,
    }));
  }

  public override resetColumns() {
    super.resetColumns();
    this.activeItemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType, SubItemType.Active));
    this.completedItemsTable?.resetColumnDefs(getDefaultListViewState(this.itemType, SubItemType.Completed));
  }

  override columnPrefsUpdated(columnPrefs: ListViewState) {
    this.hasListViewStateDeviatedFromDefault = haveColumnStatesDeviatedFromDefault(
      this.itemType,
      columnPrefs.getColumnStates(),
      this.showCompletedBatches ? SubItemType.Completed : SubItemType.Active,
    );

    saveDataToLocalStorage(this.BATCH_LIST_VIEW_STORAGE_KEY, {
      columnState: columnPrefs.getColumnStates(),
      differentThanDefaults: this.hasListViewStateDeviatedFromDefault,
    });
  }

  get isSelectedSuspended() {
    return this.selectedRows[0]?.suspended;
  }

  reload() {
    this.data = [];
    this.page = 1;
    this.initListViewState();

    this.updateRoute({
      showCompleted: this.showCompletedBatches,
      page: undefined,
      sorting: JSON.stringify(this.sorting?.filter((sort) => sort.colId !== 'endTime')),
      filters: undefined,
    });
    this.loadData();
  }

  async delete() {
    this.isLoading = true;
    await this.confirmActionService.deleteBatches(
      this.selectedRows.map((r) => r.id),
      this.showCompletedBatches,
      {
        success: this.onDelete.bind(this),
        canceled: this.onActionCancel.bind(this),
        error: this.onActionCancel.bind(this),
      },
    );
  }

  async toggleSuspended() {
    this.isLoading = true;
    await this.confirmActionService.activateOrSuspendBatches(
      this.selectedRows.map((r) => r.id),
      this.isSelectedSuspended,
      {
        success: this.onToggleSuspended.bind(this),
        canceled: this.onActionCancel.bind(this),
        error: this.onActionCancel.bind(this),
      },
    );
  }

  canToggleSuspended() {
    return (
      this.selectedRows.length &&
      (this.selectedRows.every((row) => row.suspended) || this.selectedRows.every((row) => !row.suspended))
    );
  }

  retry() {
    this.isLoading = true;
    this.confirmActionService.retryJobsForBatches(
      this.selectedRows.map((row) => ({ batchId: row.batchId, batchJobDefinitionId: row.batchJobDefinitionId })),
      {
        success: this.onRetry.bind(this),
        canceled: this.onActionCancel.bind(this),
        error: this.onActionError.bind(this),
      },
    );
  }

  onDelete() {
    this.loadData();
  }

  onToggleSuspended() {
    this.loadData();
  }

  onRetry() {
    this.loadData();
  }

  onActionCancel() {
    this.isLoading = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onActionError(err: Error) {
    this.isLoading = false;
  }

  protected readonly top = top;
}
