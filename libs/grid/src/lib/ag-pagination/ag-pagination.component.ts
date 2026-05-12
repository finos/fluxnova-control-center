import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { SubSink } from 'subsink';
import { defaultPage, defaultPageSize, pageSizeMax, pageSizeMin } from './paging-defaults';

@Component({
  selector: 'fluxnova-ag-pagination',
  templateUrl: './ag-pagination.component.html',
  styleUrls: ['./ag-pagination.component.css'],
  standalone: false,
})
export class AgPaginationComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);

  @Input() totalItems = 0;
  @Input() defaultPageSize = 0;
  @Input() loading? = false;
  @Output() paginationChanged = new EventEmitter<{ pageSize: number; page: number }>();
  @ViewChild(NgbPagination) pagination!: NgbPagination;

  options = [pageSizeMin, 100, 250, 500, 750, pageSizeMax];
  pageSize = defaultPageSize;
  page = defaultPage;
  subs = new SubSink();

  get upperBoundResults() {
    return this.pageSize * (this.page - 1) + this.pageSize <= this.totalItems
      ? this.pageSize * (this.page - 1) + this.pageSize
      : this.totalItems;
  }

  ngOnInit() {
    this.subs.add(
      this.route.queryParams.subscribe((queryParams: Params) => {
        this.page = parseInt(queryParams.page, 10) || defaultPage;
        this.pageSize = parseInt(queryParams.pageSize, 10) || this.defaultPageSize || defaultPageSize;
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onPaginationChanged() {
    this.paginationChanged.emit({ pageSize: this.pageSize, page: this.page });
  }

  updatePageSize(size: number) {
    //bound to view component
    this.pageSize = size;

    //ng bootstrap pagination component
    this.pagination.pageSize = size;
    //the _updatePages function in ng bootstrap only gets called with a page change so
    // to make sure it triggers even if the page number doesn't change we first set it to zero
    this.pagination.page = 0;
    this.pagination.selectPage(1);
  }
}
