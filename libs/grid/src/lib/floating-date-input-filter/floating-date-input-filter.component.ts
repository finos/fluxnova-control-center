import { Component } from '@angular/core';
import { convertDateToFluxnovaString, DateFilterTypes, RadioButtonItem } from '@fxn/common';
import { IFloatingFilterAngularComp } from 'ag-grid-angular';
import { IFloatingFilterParams } from 'ag-grid-community';
import { FILTER_COMPARATOR_DICTIONARY } from '@fxn/types';

@Component({
  selector: 'fluxnova-ag-grid-floating-date-input',
  templateUrl: './floating-date-input-filter.component.html',
  styleUrls: ['./floating-date-input-filter.component.scss'],
  standalone: false,
})
export class FloatingDateInputFilterComponent implements IFloatingFilterAngularComp {
  private params?: IFloatingFilterParams;
  dateRange: { dateFrom: string; dateTo?: string } | null = null;
  filterType?: DateFilterTypes;
  filterComparatorOptions: RadioButtonItem[] = [];
  multipleComparators = false;

  agInit(params: IFloatingFilterParams) {
    this.params = params;
    this.filterComparatorOptions =
      params.column
        .getColDef()
        ?.filterParams?.comparators?.map((x: string) => ({ name: FILTER_COMPARATOR_DICTIONARY[x], value: x })) || [];
    this.filterComparatorOptions[0].checked = true;
    this.filterType = this.filterComparatorOptions?.[0].value as DateFilterTypes;
  }

  onParentModelChanged(parentModel: any) {
    if (parentModel) {
      this.updateCurrentFilterComparator(parentModel?.type);
      this.dateRange = { dateFrom: parentModel?.dateFrom, dateTo: parentModel?.dateTo };
    } else {
      this.dateRange = null;
    }
  }

  clear() {
    this.dateRangeChanged();
  }

  updateCurrentFilterComparator(selectedFilterComparatorValue?: DateFilterTypes | string) {
    if (selectedFilterComparatorValue && selectedFilterComparatorValue !== this.filterType) {
      this.filterType = selectedFilterComparatorValue as DateFilterTypes;
      this.filterComparatorOptions = this.filterComparatorOptions.map((option) => ({
        ...option,
        checked: option.value === this.filterType,
      }));
    }
  }

  getModel() {
    return this.dateRange
      ? {
          ...this.dateRange,
          type: this.filterType,
        }
      : null;
  }

  setModel(model?: { dateFrom?: string; dateTo?: string; type: DateFilterTypes }) {
    this.dateRange = model?.dateFrom ? { dateFrom: model.dateFrom, dateTo: model.dateTo } : null;
    this.updateCurrentFilterComparator(model?.type);
  }

  doesFilterPass(): boolean {
    return true;
  }

  isFilterActive(): boolean {
    return !!this.dateRange?.dateFrom;
  }

  dateRangeChanged(event?: { dateFrom?: Date; dateTo?: Date; filterType: DateFilterTypes }) {
    let filterModel;
    if (event) {
      const dateFrom = (event?.dateFrom && convertDateToFluxnovaString(event.dateFrom)) || '';
      const dateTo = (event?.dateTo && convertDateToFluxnovaString(event.dateTo)) || undefined;
      this.dateRange = { dateFrom, dateTo };
      filterModel = {
        ...this.dateRange,
        filterType: 'date',
        type: this.filterType,
      };
    } else {
      this.dateRange = null;
    }
    this.params?.api.setFilterModel({
      ...this.params.api.getFilterModel(),
      [this.params.column.getColId()]: filterModel,
    });
  }

  popupOpened() {
    const datepicker = document.querySelector('ngb-datepicker');
    // needed so that ag-grid doesn't close the filter popup when clicking on the calendar
    // https://www.ag-grid.com/javascript-grid-date-component/
    datepicker?.classList?.add('ag-custom-component-popup');
  }
}
