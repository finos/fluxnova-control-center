import { Component, OnDestroy } from '@angular/core';
import { RadioButtonItem } from '@fxn/common';
import { FILTER_COMPARATOR_DICTIONARY } from '@fxn/types';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams } from 'ag-grid-community';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DynamicallyDisabledFilterComponent } from '../dynamically-disabled-filter/dynamically-disabled-filter.component';

@Component({
  selector: 'fluxnova-default-floating-filter',
  templateUrl: './default-floating-filter.component.html',
  styleUrls: ['./default-floating-filter.component.scss'],
  standalone: false,
})
export class DefaultFloatingFilterComponent
  extends DynamicallyDisabledFilterComponent
  implements IFilterAngularComp, OnDestroy
{
  filterChange$ = new Subject<string>();
  currentFilter?: string;
  filterComparatorOptions: RadioButtonItem[] = [];
  currentFilterComparator?: string;
  multipleComparators = false;
  labelForId = 'defaultFloatingFilter';
  filterFormat: 'text' | 'number' = 'text';

  agInit(params: IFilterParams) {
    super.agInit(params);
    this.filterFormat = this.setFilterFormat(params.column.getColDef().filterParams?.filterFormat);
    this.labelForId = params.column.getColDef().field || this.labelForId;
    this.multipleComparators = params.column.getColDef()?.filterParams?.comparators?.length > 1;
    this.filterComparatorOptions =
      params.column
        .getColDef()
        ?.filterParams?.comparators?.map((x: string) => ({ name: FILTER_COMPARATOR_DICTIONARY[x], value: x })) || [];
    this.filterComparatorOptions[0].checked = true;
    this.currentFilterComparator = this.filterComparatorOptions?.[0].value;
    this.subSink.add(this.filterChange$.pipe(debounceTime(800)).subscribe(() => this.updateFilterModel()));
  }

  doesFilterPass(): boolean {
    return true;
  }

  getModel() {
    return this.currentFilter
      ? {
          filter: this.currentFilter,
          type: this.currentFilterComparator,
        }
      : null;
  }

  isFilterActive(): boolean {
    return !!this.currentFilter;
  }

  clear() {
    this.currentFilter = undefined;
    this.updateFilterModel();
  }

  setModel(model: { filter?: string; type: string }) {
    this.currentFilter = model?.filter;
    this.currentFilterComparator = model?.type;
  }

  updateCurrentFilterComparator(selectedFilterComparatorValue: string) {
    this.currentFilterComparator = selectedFilterComparatorValue;
    this.filterComparatorOptions = this.filterComparatorOptions.map((option) => ({
      ...option,
      checked: option.value === selectedFilterComparatorValue,
    }));
    if (this.currentFilter) {
      this.updateFilterModel();
    }
  }

  updateFilterModel() {
    this.params?.api.setFilterModel({
      ...this.params.api.getFilterModel(),
      [this.params.column.getColId()]: this.getModel(),
    });
  }

  onParentModelChanged(model?: { filter?: string }) {
    this.currentFilter = model?.filter;
  }

  setFilterFormat(type?: string | string[]) {
    switch (type) {
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  }
}
