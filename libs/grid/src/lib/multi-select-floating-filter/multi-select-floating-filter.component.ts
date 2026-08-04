import { Component, OnDestroy } from '@angular/core';
import { RadioButtonItem } from '@fxn/common';
import { FILTER_COMPARATOR_DICTIONARY } from '@fxn/types';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams } from 'ag-grid-community';
import { isEqual, uniq } from 'lodash-es';
import { DynamicallyDisabledFilterComponent } from '../dynamically-disabled-filter/dynamically-disabled-filter.component';

interface MultiSelectOption {
  value: string;
  label: string;
  default?: boolean;
}

export enum FilterFormats {
  stringifiedArray = 'stringifiedArray',
  commaList = 'commaSeparatedList',
  array = 'textArray',
}

@Component({
  selector: 'fluxnova-multi-select-floating-filter',
  templateUrl: './multi-select-floating-filter.component.html',
  styleUrls: ['./multi-select-floating-filter.component.scss'],
  standalone: false,
})
export class MultiSelectFloatingFilterComponent
  extends DynamicallyDisabledFilterComponent
  implements IFilterAngularComp, OnDestroy
{
  itemOptions?: MultiSelectOption[];
  presetMultiFilterOptions?: MultiSelectOption[];
  selectedItemsString? = '';
  selectedItemsArray?: MultiSelectOption[];
  multiSelect = false;
  filterComparatorOptions: RadioButtonItem[] = [];
  currentFilterComparator?: 'multi' | string;
  colDefMaxSelectedItems? = 5;
  filterFormat: FilterFormats = FilterFormats.stringifiedArray;
  allowAddNewItems = false;
  multipleComparators = false;
  labelForId = 'multiSelectFloatingFilter';
  disableSanitize = false;
  isDefaultSelected = false;
  defaultItems: MultiSelectOption[] = [];

  get maxSelectedItems() {
    return this.currentFilterComparator === 'multi' ? this.colDefMaxSelectedItems : 1;
  }

  override agInit(params: IFilterParams) {
    super.agInit(params);
    this.presetMultiFilterOptions = params.column.getColDef()?.filterParams?.multiFilterOptions;
    this.multipleComparators = params.column.getColDef()?.filterParams?.comparators?.length > 1;
    this.itemOptions = this.presetMultiFilterOptions;
    this.multiSelect = !!params.column.getColDef()?.filterParams?.isMultiSelect;
    this.disableSanitize = params.column.getColDef()?.filterParams?.disableSanitize;
    this.filterFormat = params.column.getColDef()?.filterParams?.filterFormat || this.filterFormat;
    this.filterComparatorOptions =
      params.column
        .getColDef()
        ?.filterParams?.comparators?.map((x: string) => ({ name: FILTER_COMPARATOR_DICTIONARY[x], value: x })) || [];
    this.currentFilterComparator = this.filterComparatorOptions?.[0].value;
    this.filterComparatorOptions[0].checked = true;
    this.colDefMaxSelectedItems = params.column.getColDef()?.filterParams.maxSelectedItems;
    this.allowAddNewItems = !this.presetMultiFilterOptions?.length;
    this.labelForId = params.column.getColDef().field || this.labelForId;
    this.defaultItems = this.presetMultiFilterOptions?.filter((d) => d.default) || [];
    this.isDefaultSelected = this.getIsDefaultSelected();
    if (this.defaultItems.length && !this.selectedItemsArray?.length) {
      this.initializeWithDefaultOnEmptyArray();
    }
  }

  doesFilterPass(): boolean {
    return true;
  }

  getModel() {
    return this.selectedItemsString
      ? {
          filterType: this.filterFormat,
          filter: this.selectedItemsString,
          type: this.currentFilterComparator,
          ...(this.isDefaultSelected ? { defaultValue: this.isDefaultSelected } : {}),
        }
      : null;
  }

  isFilterActive(): boolean {
    return !!this.selectedItemsString?.length && !this.isDefaultSelected;
  }

  setModel(model: { filter?: string; type: string }) {
    this.selectedItemsString = model?.filter;
    this.currentFilterComparator = model?.type;
  }

  updateSelectedItems(selectedItems: MultiSelectOption[]) {
    if (
      selectedItems &&
      selectedItems.length > 0 &&
      selectedItems[0]?.value.includes(',') &&
      this.currentFilterComparator !== 'multi' &&
      this.filterComparatorOptions.some((option) => option.value === 'multi')
    ) {
      this.updateCurrentFilterComparator('multi');
    }
    if (selectedItems && !this.getIsDefaultSelected(selectedItems)) {
      this.selectedItemsString = this.setSelectedItemsStringByFilterFormat(selectedItems);
    } else {
      this.selectedItemsString = undefined;
    }
    this.updateFilterModel();
  }

  setSelectedItemsStringByFilterFormat(selectedItems: MultiSelectOption[]) {
    if (selectedItems.length === 1 && selectedItems[0].value === null) {
      return this.filterFormat === FilterFormats.stringifiedArray ? '["null"]' : 'null';
    } else {
      const sanitizedArray = this.allowAddNewItems
        ? this.sanitizedUserAddedSelectedItems(selectedItems.map((x) => x?.value))
        : selectedItems.map((x) => x.value);
      if (!sanitizedArray.length) {
        return undefined;
      }
      return this.filterFormat === FilterFormats.stringifiedArray
        ? JSON.stringify(sanitizedArray)
        : sanitizedArray.join(',');
    }
  }

  updateCurrentFilterComparator(selectedFilterComparatorValue: 'multi' | string) {
    this.currentFilterComparator = selectedFilterComparatorValue;
    this.filterComparatorOptions = this.filterComparatorOptions.map((option) => ({
      ...option,
      checked: option.value === selectedFilterComparatorValue,
    }));
    this.handleChangeComparatorToSingleSelect();
    if (this.selectedItemsString) {
      this.updateFilterModel();
    }
  }

  handleChangeComparatorToSingleSelect() {
    if (this.currentFilterComparator !== 'multi' && this.selectedItemsArray && this.selectedItemsArray.length > 1) {
      this.onParentModelChanged({ filter: this.selectedItemsArray[0].value });
    }
  }

  updateFilterModel() {
    this.params?.api.setFilterModel({
      ...this.params.api.getFilterModel(),
      [this.params.column.getColId()]: {
        filterType: this.filterFormat,
        filter: this.selectedItemsString,
        type: this.currentFilterComparator,
      },
    });
  }

  onParentModelChanged(model: { filter?: string }) {
    this.selectedItemsString = model?.filter;
    let modelFilterArray: string[] = [];

    if (this.filterFormat === FilterFormats.stringifiedArray) {
      try {
        modelFilterArray = JSON.parse(this.selectedItemsString || '[]');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        modelFilterArray = this.selectedItemsString ? [this.selectedItemsString] : [];
      }
    } else {
      modelFilterArray = this.selectedItemsString?.split(',') || [];
    }

    if (!this.allowAddNewItems) {
      if (modelFilterArray?.length) {
        this.selectedItemsArray =
          this.presetMultiFilterOptions?.filter((x) => modelFilterArray.includes(x.value)) || [];
      } else {
        this.selectedItemsArray = this.defaultItems;
        this.selectedItemsString = this.setSelectedItemsStringByFilterFormat(this.selectedItemsArray);
      }
    } else {
      this.selectedItemsArray = this.sanitizedUserAddedSelectedItems(modelFilterArray).map((x) => ({
        label: x,
        value: x,
      }));
      this.itemOptions = this.selectedItemsArray;
    }

    this.isDefaultSelected = this.getIsDefaultSelected();
  }

  sanitizedUserAddedSelectedItems(items: string[] = []) {
    if (this.disableSanitize) return items;
    return uniq(items.map((x) => x.trim()).filter((x) => x));
  }

  getIsDefaultSelected(selectedArray = this.selectedItemsArray) {
    const defaultFields = this.defaultItems.map((x) => x.value).sort();
    const currentFields = selectedArray?.map((x) => x.value).sort();
    return isEqual(defaultFields, currentFields);
  }

  initializeWithDefaultOnEmptyArray() {
    this.onParentModelChanged({ filter: this.setSelectedItemsStringByFilterFormat(this.defaultItems) });
  }
}
