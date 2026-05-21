import { Component, OnDestroy } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams } from 'ag-grid-community';
import { DynamicallyDisabledFilterComponent } from '../dynamically-disabled-filter/dynamically-disabled-filter.component';

interface SelectOption {
  value: string;
  label: string;
  default?: boolean;
}

@Component({
  selector: 'fluxnova-single-select-floating-filter',
  templateUrl: './single-select-floating-filter.component.html',
  styleUrls: ['./single-select-floating-filter.component.scss'],
  standalone: false,
})
export class SingleSelectFloatingFilterComponent
  extends DynamicallyDisabledFilterComponent
  implements IFilterAngularComp, OnDestroy
{
  itemOptions?: SelectOption[];
  selectedItemsString? = '';
  labelForId = 'singleSelectFloatingFilter';
  filterType = 'select';

  override agInit(params: IFilterParams) {
    super.agInit(params);
    this.itemOptions = params.column.getColDef()?.filterParams?.singleFilterOptions;
    this.labelForId = params.column.getColDef().field || this.labelForId;
    this.filterType = (params.column.getColDef().type as string) || this.filterType;
  }

  doesFilterPass(): boolean {
    return true;
  }

  getModel() {
    return this.selectedItemsString
      ? {
          filterType: this.filterType,
          filter: this.selectedItemsString,
          type: 'equals',
        }
      : null;
  }

  setModel(model: { filter?: string; type: string }) {
    this.selectedItemsString = model?.filter;
  }

  isFilterActive(): boolean {
    return !!this.selectedItemsString;
  }

  updateSelectedItem(selectedItem: SelectOption) {
    if (selectedItem) {
      this.selectedItemsString = selectedItem?.value || '';
    } else {
      this.selectedItemsString = undefined;
    }
    this.updateFilterModel();
  }

  updateFilterModel() {
    this.params?.api.setFilterModel({
      ...this.params.api.getFilterModel(),
      [this.params.column.getColId()]: {
        filterType: this.filterType,
        filter: this.selectedItemsString,
        type: 'equals',
      },
    });
  }

  onParentModelChanged(model: { filter?: string }) {
    this.selectedItemsString = model?.filter;
  }
}
