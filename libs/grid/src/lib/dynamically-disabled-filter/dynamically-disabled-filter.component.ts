import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ColDefWithFilterParams, FilterDisable } from '@fxn/types/src';
import { IFilterParams } from 'ag-grid-community';
import { SubSink } from 'subsink';

@Component({ template: '', standalone: false })
export class DynamicallyDisabledFilterComponent implements OnDestroy {
  route = inject(ActivatedRoute);

  params?: IFilterParams;
  subSink = new SubSink();
  disabledByQueryParams: FilterDisable[] = [];
  disabledByGridFilters: FilterDisable[] = [];
  get isDisabled() {
    return this.disabledByQueryParams.length > 0 || this.disabledByGridFilters.length > 0;
  }
  get colDef() {
    return this.params?.column.getColDef() as ColDefWithFilterParams | undefined;
  }
  get tooltipText() {
    const allDisablingFilters = this.disabledByGridFilters.concat(this.disabledByQueryParams);
    if (allDisablingFilters.length > 1) {
      const joinedDisplayNames = allDisablingFilters.map((filterDisable) => filterDisable.displayName).join(', ');
      return `Disabled while ${joinedDisplayNames} filters are in use`;
    } else if (allDisablingFilters.length === 1) {
      return `Disabled while ${allDisablingFilters[0].displayName} filter is in use`;
    }
    return '';
  }

  agInit(params: IFilterParams) {
    this.params = params;
    this.params.api.addEventListener('filterChanged', () => this.onOtherFilterChanged());
    this.subSink.add(this.route.queryParams.subscribe((queryParams) => this.onQueryParamsNext(queryParams)));
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  onQueryParamsNext(queryParams: Params) {
    this.disabledByQueryParams =
      this.colDef?.context?.disabledByQueryParams?.filter((disabledByFilter) =>
        queryParams.toggleFilters?.includes(disabledByFilter.field),
      ) ?? [];
  }

  onOtherFilterChanged(): void {
    this.disabledByGridFilters =
      this.colDef?.context?.disabledByFilters?.filter(
        (disabledByFilter) => this.params?.api.getColumnFilterModel(disabledByFilter.field) !== null,
      ) ?? [];
  }
}
