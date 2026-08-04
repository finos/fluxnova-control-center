import { Component, ViewChild } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-tooltip-header-component',
  template: `
    <div class="ag-cell-label-container" role="presentation">
      <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>
      <div
        ref="eLabel"
        class="ag-header-cell-label"
        role="presentation"
        (click)="params?.column.getColDef().sortable ? onSortRequested($event) : null"
      >
        <span
          ref="eText"
          class="ag-header-cell-text"
          role="columnheader"
          [fluxnovaTruncateWithTooltip]="{ placement: ['top', 'auto'] }"
          container="body"
        >
          {{ params?.displayName }}
        </span>
        @if (this.eFilter === 'active') {
          <fluxnova-icon iconName="active-filter" title="Filtered" class="text-primary"></fluxnova-icon>
        }
        @if (params?.enableSorting && this.ascSort === 'active') {
          <fluxnova-icon
            iconName="sort-arrow-up"
            title="Ascending Sort"
            class="text-primary tooltip-arrow"
          ></fluxnova-icon>
        }
        @if (params?.enableSorting && this.descSort === 'active') {
          <fluxnova-icon
            iconName="sort-arrow-down"
            title="Descending Sort"
            class="text-primary tooltip-arrow"
          ></fluxnova-icon>
        }
        @if (params?.enableSorting && this.descSort !== 'active' && this.ascSort !== 'active') {
          <fluxnova-icon
            iconName="sort-unsorted"
            title="Unsorted Sort"
            class="text-primary tooltip-arrow"
          ></fluxnova-icon>
        }
      </div>
    </div>
  `,
  styleUrls: ['./tooltip-header.component.scss'],
  standalone: false,
})
export class TooltipHeaderComponent implements IHeaderAngularComp {
  public params?: IHeaderParams;
  public ascSort?: string;
  public descSort?: string;
  public noSort?: string;
  public eFilter?: string;

  @ViewChild('menuButton') public menuButton: any;

  agInit(params: IHeaderParams): void {
    this.params = params;
    params.column.addEventListener('sortChanged', this.onSortChanged.bind(this));
    params.column.addEventListener('filterChanged', this.onFilterChanged.bind(this));
    this.onSortChanged();
  }

  refresh(params: IHeaderParams): boolean {
    this.params = params;
    return true;
  }

  onMenuClicked() {
    this.params?.showColumnMenu(this.menuButton.nativeElement);
  }

  onSortChanged() {
    this.ascSort = this.descSort = this.noSort = 'inactive';
    if (this.params?.column.isSortAscending()) {
      this.ascSort = 'active';
    } else if (this.params?.column.isSortDescending()) {
      this.descSort = 'active';
    } else {
      this.noSort = 'active';
    }
  }
  onFilterChanged() {
    this.eFilter = this.params?.column.isFilterActive() ? 'active' : 'inactive';
  }

  onSortRequested(event: MouseEvent) {
    type order = 'asc' | 'desc' | null;
    const sortRefs = [this.noSort, this.ascSort, this.descSort];
    const sortOrder: order[] = [null, 'asc', 'desc'];
    let index = sortRefs.indexOf('active') + 1;
    if (index >= sortOrder.length) {
      index = 0;
    }
    this.params?.setSort(sortOrder[index], event.shiftKey);
  }
}
