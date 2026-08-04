/* eslint-disable max-lines */
import { Directive, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ColDef, FilterModel, IRowNode, RowClassParams, RowClickedEvent } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { isEmpty, isEqual, keyBy, filter as lodashFilter } from 'lodash-es';
import { debounceTime, Observable, of, Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PermissionService, ToastService } from '@fxn/common';
import { noRowsTemplate } from '@fxn/grid';
import {
  Dictionary,
  GridFilter,
  GridSort,
  ItemType,
  ItemTypeAction,
  ListViewState,
  LocalStorageColumnPrefData,
} from '@fxn/types';
import { PimTab, PimTabRowQueryParam } from '../item-detail-tab-utils';
import { ItemDetailPageCommunicationService } from '../item-detail-page.communication.service';
import { convertFilterQueryParamToLoadOptions, convertSortQueryParamToLoadOptions } from '../../services/service-utils';
import { ItemsTableComponent } from '../../common/items-table/items-table.component';
import {
  getDefaultSortingFromColumnDefinitions,
  getDefaultTabFilters,
  haveColumnStatesDiverged,
  mergeSavedListViewStateWithSuppliedColumnDefinitions,
} from '../../common/list-utils';
import { getDataSavedInLocalStorage, saveDataToLocalStorage } from '../../common/storage-utils';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';

@Directive()
export abstract class BaseTabComponent implements OnDestroy {
  protected route = inject(ActivatedRoute);
  protected toastService = inject(ToastService);
  protected permissionService?: PermissionService | null = inject(PermissionService, { optional: true });

  public eventBus = inject(ItemDetailPageCommunicationService);
  public router = inject(Router);

  /**
   Generate an appropriately unique string to use as the key under which to store our list view state in localStorage
   */
  get LIST_VIEW_STATE_STORAGE_KEY(): string {
    const tabWithVariant = this.tabVariant ? `${this.tab}-${this.tabVariant}` : this.tab;

    return `${this.detailItemType}-detail-tab-${tabWithVariant}.listviewstate`.toLowerCase();
  }

  protected get tenantId(): string {
    return this.route.snapshot.params.tenant;
  }

  private _detailItemType?: ItemType;
  private _detailItemId?: string;
  private _selectedItemId?: string;
  private _filteredActivityId?: string;
  private _highlightedActivityId = '';

  data?: any[];
  dataSubscription?: Subscription;
  isLoading?: boolean = true;
  routeSubscription?: Subscription;
  reloadNeededSub$?: Subscription;
  sorting: GridSort[] = [];
  filters?: Dictionary<GridFilter>;
  listViewState?: ListViewState;
  paginationSubject$ = new Subject<{ page: number; pageSize: number }>();
  firstResult = 0;
  maxResults = 50;
  selectedRows: any[] = [];
  idSub$?: Subscription;
  hasListViewStateDeviatedFromDefault = false;
  hasFilterOrSortDeviatedFromDefault = false;
  buttonPermissionsNeeded: ItemTypeAction[] = [];
  anyButtonVisible = false;

  /**
   * Count is inputted by detail page, sourced from the "tabCounts" object.
   */
  @Input() totalCount?: number;

  @ViewChild(ItemsTableComponent) itemTable?: ItemsTableComponent;

  get agGrid(): AgGridAngular | undefined {
    return this.itemTable?.agGrid;
  }

  /**
   * User supplied filters are sanitized against the available filters that
   * have been defined in the column definitions and are added to the
   * default item filter (eg, processInstanceId === some id) for the detail
   * page.  The combination of the two plus sorting is what makes up `dataFilter`.
   */
  get userSuppliedFilters(): Params {
    const colDefDict = keyBy(
      lodashFilter(this.columnDefinitions, (columnDefinition) => columnDefinition.filter),
      'field',
    );
    return {
      ...convertFilterQueryParamToLoadOptions(this.filters ?? {}, colDefDict as Dictionary<ColDef>),
    };
  }

  @Input()
  set detailItem(detailItemInfo: { id: string | Observable<string>; type: ItemType }) {
    const idObs$: Observable<string> =
      detailItemInfo.id instanceof Observable ? detailItemInfo.id : of(detailItemInfo.id);

    this.idSub$ = idObs$.subscribe((value: string) => {
      this._detailItemType = detailItemInfo.type;
      this._detailItemId = value;

      this.init();
    });
  }

  get detailItemType(): ItemType | undefined {
    return this._detailItemType;
  }

  /**
   * Returns the id of the item being displayed in the detail page.
   */
  get detailItemId(): string | undefined {
    return this._detailItemId;
  }

  /**
   * Returns the id of the row that has been selected.
   */
  get selectedItemId(): string | undefined {
    return this._selectedItemId;
  }

  /**
   * This should only be set by the subscription
   * watching the route query parameters.  The
   * pattern is:
   * handle row click -> update url -> subscription
   * updates the selected item and highlightedActivityId ->
   * re-render relevant row nodes to apply highlighted class.
   *
   * This is so that we handle state in the same way
   * regardless of when the url is updated (ie,
   * whether by 'deeplinking' to the detail page with
   * a row selection, or by clicking on a row manually).
   *
   * @param itemId
   */
  set selectedItemId(itemId: string) {
    this._selectedItemId = itemId;
  }

  get highlightedActivityId(): string {
    return this._highlightedActivityId;
  }

  set highlightedActivityId(value: string) {
    const rowsToRedraw: IRowNode[] = this.agGrid?.api
      .getRenderedNodes()
      ?.filter(
        (node) => node.data.activityId === value || node.data.activityId === this.highlightedActivityId,
      ) as IRowNode[];
    this._highlightedActivityId = value;
    this.agGrid?.api.redrawRows({ rowNodes: rowsToRedraw });
  }

  /**
   * The activity that the tab should filter on is set by the query param subscription
   */
  set filteredActivityId(id: string | undefined) {
    const api = this.agGrid?.api;
    const activityColumnKey = this.activityColumnKey;

    if (!api || !api.getColumn(activityColumnKey)) {
      return;
    }

    const filterModel = id ? { filter: id, type: 'equals' } : null;

    api.setColumnFilterModel(activityColumnKey, filterModel).then(() => {
      api.onFilterChanged();
    });
    this._filteredActivityId = id;
  }

  get filteredActivityId(): string | undefined {
    return this._filteredActivityId;
  }

  get overlayNoRowsTemplate() {
    return noRowsTemplate(this.tab);
  }

  /**
   * Generic data filter.  Should be overridden in
   * concrete class to return specific filter.
   */
  get dataFilter(): any {
    return this.detailItemId ?? '';
  }

  get sortOrder() {
    return this.sorting[0]?.sort;
  }

  /**
   * TODO: Can we handle this better?
   */
  get sortBy() {
    const colDefDict = keyBy(this.columnDefinitions, 'field');
    const transformedSort = convertSortQueryParamToLoadOptions(this.sorting ?? [], colDefDict);
    return transformedSort?.[0].sortBy;
  }

  /**
   * Generic data service.  Should be overridden in
   * concrete class to call the specific service for loading data.
   */
  abstract dataService<T>(request: PaginatedDataRequest): Observable<T[]>;

  abstract columnDefinitions: ColDef[];

  abstract get tab(): PimTab;

  /**
   * Allow descendants to specify a variant of the tab name. This might be needed to disambiguate
   * saved preferences under specific circumstances, such as
   *   - A particular tab may need to show (and store) different sets of column definitions under
   *     different circumstances (e.g. operating state).
   *   - Some pages might need to save state for different tabs (and preferences) but with the
   *     same tab name.
   */
  get tabVariant(): string {
    return '';
  }

  abstract get rowItemQueryParam(): PimTabRowQueryParam;

  /**
   * The column key used to identify the activity on this tab's grid.
   * Override in subclasses where the column key differs (e.g. UserTasks uses 'taskDefinitionKey').
   */
  protected get activityColumnKey(): string {
    return 'activityId';
  }

  /**
   * Initialization function for the component.  Called when
   * the detailItemId has been set on the component.
   */
  async init() {
    // In order to avoid filters remaining when navigating from the
    // Process Instance Detail Page to the Process Instance Detail Page (of a different process)
    // by clicking the process instance id in the called process instances tab
    // we need to clear the filters on init.
    this.filters = undefined;

    if (this.permissionService) {
      this.anyButtonVisible = await this.permissionService.hasAnyPermission(this.buttonPermissionsNeeded);
    }

    this.routeSubscription = this.route.queryParams.subscribe((params) => {
      if (params['filteredActivityId'] !== this.filteredActivityId) {
        this.filteredActivityId = params['filteredActivityId'];
      }
      this.selectedItemId = params[this.rowItemQueryParam];
      this.highlightedActivityId = params.activityId;
    });
    this.reloadNeededSub$ = this.eventBus.reloadNeeded$.subscribe((doReload) => {
      if (doReload) {
        this.handleReload();
      }
    });
    this.paginationSubject$.pipe(debounceTime(300)).subscribe((pagination) => {
      this.firstResult = (pagination.page - 1) * pagination.pageSize;
      this.maxResults = pagination.pageSize;
      this.loadData();
    });

    const saved = getDataSavedInLocalStorage<LocalStorageColumnPrefData>(this.LIST_VIEW_STATE_STORAGE_KEY);
    this.listViewState = !isEmpty(saved)
      ? mergeSavedListViewStateWithSuppliedColumnDefinitions(saved.columnState, this.columnDefinitions)
      : new ListViewState(this.columnDefinitions);
    this.hasListViewStateDeviatedFromDefault = saved.differentThanDefaults ?? false;

    this.initSorting();
    this.initFilters();
    this.loadData();
  }

  onGridReady() {
    this.filteredActivityId = this.route.snapshot.queryParams.filteredActivityId;
  }

  initSorting() {
    this.columnDefinitions.forEach((colDef) => {
      if (colDef.initialSort && colDef.colId) {
        this.sorting = [
          {
            sort: colDef.initialSort,
            colId: colDef.colId,
          },
        ];
      }
    });
  }

  initFilters() {
    this.filters = getDefaultTabFilters(this.tab);
  }

  handleReload() {
    this.loadData();
    this.sendFilterChangedNotification();
  }

  /**
   * Function for loading the data for the grid.
   *
   * @param filter
   */
  loadData(filter: any = this.dataFilter) {
    this.isLoading = true;
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.dataService(
      new PaginatedDataRequest(JSON.parse(JSON.stringify(filter)), this.maxResults, this.firstResult),
    )
      .pipe(delay(0))
      .subscribe({
        next: this.onDataLoad.bind(this),
        error: (error: any) => this.onDataLoadFailed(error),
      });
  }

  /**
   * Function to handle the data load subscription.
   * @param data
   */
  onDataLoad(data: any[]) {
    this.data = data;
    this.isLoading = false;
  }

  onDataLoadFailed(error: any) {
    this.isLoading = false;
    this.data = [];
    this.toastService.error(`Loading tab data for ${this.tab} failed with the following error: ${error.message}`);
  }

  async resetUrl() {
    await this.router.navigate([], {
      replaceUrl: true,
      queryParams: {
        tab: this.tab.toLowerCase(),
      },
    });
  }

  selectRow(id?: string, property: string = 'id') {
    this.agGrid?.api.forEachNode((node) => {
      if (node.data?.[property] === id && node.data?.activityId) {
        this.router.navigate([], {
          replaceUrl: true,
          queryParamsHandling: 'merge',
          queryParams: { activityId: node.data?.activityId },
        });
      }
    });
  }

  onFirstDataRendered() {
    this.selectRow(this.selectedItemId);
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    this.reloadNeededSub$?.unsubscribe();
    this.idSub$?.unsubscribe();
  }

  async onRowClick(event: RowClickedEvent) {
    const clickedSameRow =
      event.data?.activityId === this.highlightedActivityId && event.data?.id === this.selectedItemId;
    if (event.data?.activityId) {
      this.eventBus.rowClickedWithActivity(event.data?.activityId);
    }
    await this.router.navigate([], {
      replaceUrl: true,
      queryParams: {
        activityId: clickedSameRow ? undefined : event.data?.activityId,
        [this.rowItemQueryParam]: clickedSameRow ? undefined : event.data?.id,
        filteredActivityId: this.route.snapshot.queryParams.filteredActivityId,
        tab: this.tab.toLowerCase(),
      },
    });
  }

  public onSelectionChanged(rows: any[]) {
    this.selectedRows = rows;
  }

  onSortChanged(sort: GridSort[]) {
    this.sorting = sort;
    this.updateHasFilterOrSortDeviated();
    this.loadData();
  }

  async onFilterChanged(filterModel: FilterModel) {
    const oldFilters = this.filters;
    this.filters = filterModel;
    const activityColumn = filterModel[this.activityColumnKey];
    await this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: {
        activityId: activityColumn?.filter,
        filteredActivityId: activityColumn?.filter,
      },
      skipLocationChange: true,
    });
    this.updateHasFilterOrSortDeviated();
    if (!isEqual(oldFilters, this.filters)) {
      this.loadData();
    }
    this.sendFilterChangedNotification();
  }

  sendFilterChangedNotification() {
    this.eventBus.tabFilterUpdated({
      tab: this.tab,
      filter: JSON.parse(JSON.stringify(this.dataFilter)),
    });
  }

  isRowSelectable(row: IRowNode<any>): boolean {
    return !!row;
  }

  public rowClassRules = () => ({
    'row-highlighted': (params: RowClassParams) =>
      params?.data?.activityId === this.highlightedActivityId && params?.data?.id === this.selectedItemId,
  });

  columnPrefsUpdated(columnPrefs: ListViewState) {
    const columnState = columnPrefs.getColumnStates();
    this.hasListViewStateDeviatedFromDefault = haveColumnStatesDiverged(columnState, this.columnDefinitions);
    saveDataToLocalStorage(this.LIST_VIEW_STATE_STORAGE_KEY, {
      columnState,
      differentThanDefaults: this.hasListViewStateDeviatedFromDefault,
    });
  }

  protected updateHasFilterOrSortDeviated() {
    const filtersHaveDeviated = !isEqual(this.filters, getDefaultTabFilters(this.tab));
    const sortingHasDeviated = !isEqual(this.sorting, getDefaultSortingFromColumnDefinitions(this.columnDefinitions));
    this.hasFilterOrSortDeviatedFromDefault = filtersHaveDeviated || sortingHasDeviated;
  }

  protected get showResetGridButton() {
    return this.hasFilterOrSortDeviatedFromDefault || this.hasListViewStateDeviatedFromDefault;
  }

  async onResetGridClick() {
    this.filters = undefined;
    this.sorting = [];
    this.resetUrl();
    this.initSorting();
    this.initFilters();
    this.itemTable?.resetColumnDefs(new ListViewState(this.columnDefinitions));
    this.loadData();
  }
}
