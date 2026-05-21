import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  Dictionary,
  GridFilter,
  GridSort,
  ItemType,
  ItemTypeAction,
  ListOptions,
  ListViewState,
  LocalStorageColumnPrefData,
  SavedSortAndFilterData,
  ToggleFilter,
} from '@fxn/types';
import { jsonParseSafe, PermissionService } from '@fxn/common';
import { difference, filter, intersection, isEmpty, isEqual, map } from 'lodash-es';
import { debounceTime, Subject } from 'rxjs';
import { SubSink } from 'subsink';
import { mapQueryParamsOptions } from '../services/service-utils';
import {
  getDefaultListFilters,
  getDefaultListViewState,
  getDefaultRouting,
  getDefaultSorting,
  getDefaultToggleFilters,
  getItemListToggleFilters,
  haveColumnStatesDeviatedFromDefault,
  mergeSavedStateWithColumnDefinitions,
} from '../common/list-utils';
import { getDataSavedInLocalStorage, saveDataToLocalStorage } from '../common/storage-utils';
import { ConfirmActionService } from '../services/confirm-action.service';

export const defaultPage = 1;
export const defaultPageSize = 50;

@Directive()
export class BaseListComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected permissionService? = inject(PermissionService, { optional: true });
  protected subs: SubSink = new SubSink();
  protected readonly LIST_VIEW_STATE_STORAGE_KEY: string;
  protected readonly QUERY_PARAMS_STORAGE_KEY: string;
  protected confirmActionService = inject(ConfirmActionService);

  protected get tenantId(): string {
    return this.route.snapshot.params.tenant;
  }

  selectedRows: any[] = [];
  queryParams: any = {};

  // pagination properties
  totalCount = 0;
  page = defaultPage;
  pageSize = defaultPageSize;
  paginationSubject$ = new Subject<{ page: number; pageSize: number }>();

  hasListViewStateDeviatedFromDefault = false;
  hasFilterOrSortDeviatedFromDefault = false;
  listViewState: ListViewState;

  // data and data loading properties
  filters?: Dictionary<GridFilter>;
  sorting?: GridSort[];
  isLoading = false;
  data: any[] = [];

  // actual list of toggles
  toggleFilters?: ToggleFilter[];

  buttonPermissionsNeeded: ItemTypeAction[] = [];
  anyButtonVisible?: boolean = undefined;

  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(protected readonly itemType: ItemType) {
    this.LIST_VIEW_STATE_STORAGE_KEY = `${this.itemType}-list.listViewState`;
    this.QUERY_PARAMS_STORAGE_KEY = `${this.itemType}-list.params`;

    const saved = getDataSavedInLocalStorage<LocalStorageColumnPrefData>(this.LIST_VIEW_STATE_STORAGE_KEY);

    this.listViewState = !isEmpty(saved)
      ? mergeSavedStateWithColumnDefinitions(saved.columnState, this.itemType)
      : getDefaultListViewState(this.itemType);
    this.hasListViewStateDeviatedFromDefault = saved.differentThanDefaults ?? false;
  }

  async ngOnInit() {
    await this.init();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async init() {
    // Initialize toggle filters
    this.toggleFilters = getItemListToggleFilters(this.itemType);
    if (this.permissionService) {
      this.anyButtonVisible = await this.permissionService.hasAnyPermission(this.buttonPermissionsNeeded);
    }

    this.subs.add(
      this.route.queryParams.subscribe((queryParams: Params) => {
        this.queryParams = queryParams;

        // If nothing was provided in the query params,
        // load some defaults or what is in local storage
        if (difference(['filters', 'sorting', 'toggleFilters'], Object.keys(queryParams)).length === 3) {
          // Before setting defaults, check if there is anything in local storage
          const queryParamsToRestore = getDataSavedInLocalStorage<SavedSortAndFilterData>(
            this.QUERY_PARAMS_STORAGE_KEY,
          );
          const filters: Dictionary<GridFilter> | undefined = !isEmpty(queryParamsToRestore)
            ? queryParamsToRestore.filters
            : getDefaultListFilters(this.itemType);
          const sorting: GridSort[] | undefined = !isEmpty(queryParamsToRestore)
            ? queryParamsToRestore.sorting
            : getDefaultSorting(this.itemType);
          const toggleFilters: string | string[] | undefined = !isEmpty(queryParamsToRestore)
            ? queryParamsToRestore.toggleFilters
            : getDefaultToggleFilters(this.itemType);

          // Update the URL with the defaults
          this.updateRoute({
            filters: !isEmpty(filters) ? JSON.stringify(filters) : undefined,
            sorting: !isEmpty(sorting) ? JSON.stringify(sorting) : undefined,
            toggleFilters: !isEmpty(toggleFilters) ? toggleFilters : undefined,
          });
        } else {
          // Set the initial sort/filter/toggleFilter to what was provided
          this.setDataLoadParams(queryParams);

          // We only do the rest of this here because the first time to which a
          // list page is navigated and there are NO query params, the code above
          // will call the updateRoute method which then immediately triggers
          // this subscription again.  This subsequent time, the query params will be
          // present so we will now load the data.  If we don't keep the rest of this
          // within the else block, we end up with 2 loadData calls.
          //
          // In the event the list page is deep-linked into, we already have all the
          // info we need, and we'll end up here without triggering it 2x.

          const objToSave: SavedSortAndFilterData = {
            filters: this.filters,
            sorting: this.sorting,
          };

          // If this list doesn't actually have toggleFilters, then no need to save an entry for them
          if (this.toggleFilters) objToSave.toggleFilters = this.selectedToggleFilters;

          saveDataToLocalStorage(this.QUERY_PARAMS_STORAGE_KEY, objToSave);

          this.hasFilterOrSortDeviatedFromDefault = this.checkHasFilterOrSortDeviated(
            this.filters,
            this.sorting,
            this.selectedToggleFilters || '',
          );

          this.loadData();
        }
      }),
      this.paginationSubject$.pipe(debounceTime(300)).subscribe((pagination) => {
        // This subscription is triggered when the pagination component emits
        // changes from the user clicking a new page or selecting a new page size.
        this.updateRoute(pagination);
      }),
    );
  }

  setDataLoadParams(queryParams: Params) {
    if (!isEqual(this.sorting, jsonParseSafe(queryParams.sorting))) this.sorting = jsonParseSafe(queryParams.sorting);

    if (!isEqual(this.filters, jsonParseSafe(queryParams.filters))) this.filters = jsonParseSafe(queryParams.filters);

    this.toggleFilters?.forEach((toggleFilter) => {
      toggleFilter.selected = !!queryParams.toggleFilters?.includes(toggleFilter.field);
      toggleFilter.isDisabled =
        intersection(
          toggleFilter.disabledByQueryParams?.map((filterDisable) => filterDisable.field) || [],
          Object.keys(this.filters ?? {}),
        ).length > 0;
    });
    // if queryParams.page/pageSize are undefined, parseInt returns NaN here, hence the fallthrough
    this.page = parseInt(queryParams.page, 10) || defaultPage;
    this.pageSize = parseInt(queryParams.pageSize, 10) || defaultPageSize;
  }

  getMappedLoadOptions(): ListOptions {
    return mapQueryParamsOptions({
      queryParams: {
        sorting: this.sorting,
        filters: this.filters,
        toggleFilters: this.selectedToggleFilters,
        page: this.page,
        pageSize: this.pageSize,
      },
      itemType: this.itemType,
    });
  }

  public loadData() {
    this.isLoading = true;
    this.data = [];
    this.selectedRows = [];
  }

  protected onDataLoad(results: { items: any[]; count: number }) {
    this.isLoading = false;
    this.totalCount = results.count;
    this.data = results.items;
  }

  updateRoute(params?: { [key: string]: string | string[] | number | boolean | undefined }) {
    this.router.navigate([], {
      replaceUrl: true,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  get selectedToggleFilters(): string | undefined {
    return map(filter(this.toggleFilters, 'selected'), 'field').join(',');
  }

  selectToggleFilter(toggleFilter: ToggleFilter) {
    toggleFilter.selected = !toggleFilter.selected;

    this.updateRoute({ toggleFilters: this.selectedToggleFilters });
  }

  selectHeaderSort(sort?: GridSort[]) {
    const sorting = !isEmpty(sort) ? JSON.stringify(sort) : '[]';
    this.selectedRows = [];

    this.updateRoute({ sorting });
  }

  selectFilter(gridFilter?: Dictionary<GridFilter | undefined>) {
    const filters = !isEmpty(gridFilter) ? JSON.stringify(gridFilter) : '';
    this.selectedRows = [];

    this.updateRoute({ filters });
  }

  checkHasFilterOrSortDeviated(filters?: { [key: string]: any }, sorting?: GridSort[], activeToggleFilters?: string) {
    return !(
      isEqual(filters, getDefaultListFilters(this.itemType)) &&
      isEqual(sorting, getDefaultSorting(this.itemType)) &&
      (isEqual(activeToggleFilters, getDefaultToggleFilters(this.itemType)?.join(',')) ||
        (isEmpty(activeToggleFilters) && isEmpty(getDefaultToggleFilters(this.itemType))))
    );
  }

  columnPrefsUpdated(columnPrefs: ListViewState) {
    this.hasListViewStateDeviatedFromDefault = haveColumnStatesDeviatedFromDefault(
      this.itemType,
      columnPrefs.getColumnStates(),
    );

    saveDataToLocalStorage(this.LIST_VIEW_STATE_STORAGE_KEY, {
      columnState: columnPrefs.getColumnStates(),
      differentThanDefaults: this.hasListViewStateDeviatedFromDefault,
    });
  }

  public resetColumns() {
    this.updateRoute(getDefaultRouting(this.itemType));
  }
}
