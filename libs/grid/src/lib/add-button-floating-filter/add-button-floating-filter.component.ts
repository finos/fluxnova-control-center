import { Component } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-add-button-floating-filter',
  templateUrl: './add-button-floating-filter.component.html',
  styleUrls: ['./add-button-floating-filter.component.scss'],
  standalone: false,
})
export class AddButtonFloatingFilterComponent implements IFilterAngularComp {
  params?: IFilterParams;
  agInit(params: IFilterParams): void {
    this.params = params;
  }

  doesFilterPass(): boolean {
    return false;
  }

  getModel(): any {}

  isFilterActive(): boolean {
    return false;
  }

  setModel(): void {
    return undefined;
  }

  addButtonClicked() {
    this.params?.context.componentParent.addNewVariable();
  }

  isDisabled() {
    return this.params?.context.componentParent.isEditMode;
  }
}
