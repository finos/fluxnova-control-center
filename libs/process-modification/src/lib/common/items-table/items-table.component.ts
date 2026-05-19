/* eslint-disable max-lines */
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MODAL_DEFAULTS, TooltipInfoModalComponent } from '@fxn/common';
import { frameworkComponents, noRowsTemplate } from '@fxn/grid';
import { defaultColDefinition, GridFilter, GridSort, ListViewState } from '@fxn/types';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ApplyColumnStateParams,
  CellClickedEvent,
  ColDef,
  Column,
  ColumnState,
  FilterChangedEvent,
  FirstDataRenderedEvent,
  GridReadyEvent,
  IRowNode,
  ITooltipParams,
  ManagedGridOptionKey,
  ProcessUnpinnedColumnsParams,
  RowClassParams,
  RowClickedEvent,
  RowSelectionOptions,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { cloneDeep, pick } from 'lodash-es';

@Component({
  selector: 'fluxnova-items-table',
  templateUrl: './items-table.component.html',
  styleUrls: ['./items-table.component.scss'],
  standalone: false,
})
export class ItemsTableComponent {
  private modalService = inject(NgbModal);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  private _rowSelectionType: 'singleRow' | 'multiRow' = 'multiRow';
  private _checkboxes = true;
  private _listViewState: ListViewState = <ListViewState>{};
  private _rowClickSelection = false;

  protected isGridReady = false;
  protected frameworkComponents = frameworkComponents;
  protected defaultColDef = defaultColDefinition;

  public selectedRowIds: string[] = [];

  get listViewState(): ListViewState {
    return this._listViewState;
  }

  @Input()
  set listViewState(value: ListViewState) {
    this._listViewState = value ?? {};

    if (this.isGridReady) this.onGridReady({} as GridReadyEvent);
  }

  @Input()
  public items?: any[];

  @Input()
  set rowClickSelection(value: boolean) {
    this._rowClickSelection = value;
    this.gridOptions.rowSelection.enableClickSelection = value;
  }

  get rowClickSelection() {
    return this._rowClickSelection;
  }

  @Input() set filters(filters: { [key: string]: GridFilter }) {
    this.currentFilterModel = filters;
    this.agGrid?.api.setFilterModel(this.currentFilterModel);
  }

  @Input() set sorting(sorting: GridSort[]) {
    this.sortArray = sorting;
    this.agGrid?.api.applyColumnState(<ApplyColumnStateParams>{
      state: sorting,
      defaultState: {
        sort: null,
      },
    });
  }

  @Input() set rowClassRules(rules: { [className: string]: (params: RowClassParams) => boolean }) {
    this.gridOptions.rowClassRules = {
      ...this.gridOptions.rowClassRules,
      ...rules,
    };
  }

  @Input()
  public rowMultiSelectWithClick = false;

  @Input()
  public isLoading?: boolean;

  @Input()
  set isRowSelectable(rowSelectableFn: (row: IRowNode) => boolean) {
    this.gridOptions.rowSelection.isRowSelectable = rowSelectableFn;
  }

  @Input()
  set getTooltipValue(tooltipValueFn: (params: ITooltipParams) => string | null) {
    this.gridOptions.selectionColumnDef.tooltipValueGetter = tooltipValueFn;
  }

  @Input()
  set hideDisabledCheckboxes(value: boolean) {
    this.gridOptions.rowSelection.hideDisabledCheckboxes = value;
  }

  @Input()
  set rowSelectionType(value: 'singleRow' | 'multiRow') {
    this._rowSelectionType = value;

    this.gridOptions.rowSelection.mode = value;
    this.gridOptions.rowSelection.headerCheckbox = value === 'multiRow';
  }

  @Input()
  set checkboxes(value: boolean) {
    // Checking for undefined addresses an issue where the checkboxes for the grid
    // were not rendering because the grid was rendering before the permission checks
    // were complete.  Even though the checkboxes setter was being called again after
    // the call was complete, the grid would not re-render the checkboxes and display them.
    if (value !== undefined) {
      this._checkboxes = value;
      this.gridOptions.rowSelection.checkboxes = value;
    }
  }

  @Input()
  context: { componentParent: any } = { componentParent: this };

  @Input({ required: false })
  public overlayNoRowsTemplate = '';

  @Output()
  public gridReady: EventEmitter<GridReadyEvent> = new EventEmitter<GridReadyEvent>();

  @Output()
  public firstDataRendered: EventEmitter<FirstDataRenderedEvent> = new EventEmitter<FirstDataRenderedEvent>();

  @Output()
  public rowClicked: EventEmitter<RowClickedEvent> = new EventEmitter<RowClickedEvent>();

  @Output()
  public itemsSelectChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  @Output()
  public columnHeaderSortChange: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  public columnHeaderFilterChange: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  public listViewStateChange: EventEmitter<ListViewState> = new EventEmitter<ListViewState>();

  @ViewChild('agGrid')
  public agGrid?: AgGridAngular;

  public columnDefs: ColDef[] = [];
  public currentFilterModel: { [key: string]: any } = {};
  public sortArray: GridSort[] = [];
  public modal?: NgbModalRef;
  public gridOptions = {
    rowSelection: {
      mode: this._rowSelectionType,
      checkboxes: this._checkboxes,
      headerCheckbox: this._rowSelectionType === 'multiRow',
      enableClickSelection: this.rowClickSelection,
      selectAll: this.rowMultiSelectWithClick ? 'all' : undefined,
      checkboxLocation: 'autoGroupColumn',
      hideDisabledCheckboxes: true,
      isRowSelectable: this.isRowSelectable,
    },
    selectionColumnDef: {
      pinned: 'left',
      lockPinned: true,
      suppressHeaderMenuButton: true,
      maxWidth: 30,
      tooltipValueGetter: this.getTooltipValue,
    },
    rowClassRules: {
      'row-highlighted': (params: RowClassParams) => {
        if (this.rowClickSelection) {
          return this.selectedRowIds.includes(params.data.id);
        }
        return false;
      },
    },
    tooltipShowDelay: 100,
    processUnpinnedColumns: (params: ProcessUnpinnedColumnsParams) => this.onProcessUnpinnedColumns(params),
    suppressDragLeaveHidesColumns: true,
  };

  constructor() {
    this.overlayNoRowsTemplate = noRowsTemplate();
  }

  onGridReady(event: GridReadyEvent) {
    this.isGridReady = true;

    if (this.listViewState.columnDefs && this.isGridReady) {
      this.setColumnDefinitions();
      this.agGrid?.api.applyColumnState(<ApplyColumnStateParams>{
        state: this.columnDefs.map((colDef) => ({
          sort: colDef.initialSort ?? null,
          colId: colDef.filterParams?.sortByKey || colDef.field,
        })),
      });

      // If a sort was applied (e.g. from a deeplink) before the grid was ready,
      // the sorting setter could not call applyColumnState because agGrid was
      // not yet initialised.  Re-apply it now so the sort icon reflects the
      // actual sort state.
      if (this.sortArray?.length) {
        this.agGrid?.api.applyColumnState(<ApplyColumnStateParams>{
          state: this.sortArray,
          defaultState: { sort: null },
        });
      }

      this.agGrid?.api.setFilterModel(this.currentFilterModel);
      this.makeTextSelectable(true);
      this.gridReady.emit(event);
    }
  }

  onFirstDataRendered(event: FirstDataRenderedEvent) {
    this.firstDataRendered.emit(event);
  }

  setColumnDefinitions(): void {
    this.columnDefs = cloneDeep(this.listViewState.columnDefs);
    this.agGrid?.api.setGridOption('columnDefs' as ManagedGridOptionKey, this.columnDefs);
  }

  onFilterChanged(event: FilterChangedEvent) {
    const filterModel = event.api.getFilterModel();
    this.currentFilterModel = filterModel;
    this.columnHeaderFilterChange.emit(filterModel);
  }

  onRowClicked(event: RowClickedEvent): void {
    this.rowClicked.emit(event);
  }

  onCellClicked(event: CellClickedEvent) {
    if (
      event.colDef?.cellRendererParams?.isOpenModalOnClick &&
      event.colDef?.cellRenderer !== 'stackTraceRenderer' &&
      event.value
    ) {
      this.modal = this.modalService.open(TooltipInfoModalComponent, {
        ...MODAL_DEFAULTS,
        modalDialogClass: 'dynamic-modal',
      });
      const component = this.modal.componentInstance as TooltipInfoModalComponent;
      component.text = event.value;
      component.title = event.colDef.headerName;
    }
  }

  onSortChanged() {
    const sortModel = this.getSortModelFromGrid();
    this.columnHeaderSortChange.emit(sortModel);
  }

  getSortModelFromGrid(): GridSort[] {
    const columnState = this.agGrid?.api.getColumnState() ?? [];
    return columnState.filter((c) => !!c.sort).map((c) => pick(c, 'colId', 'sort')) as GridSort[];
  }

  public onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRows: any[] = event.api.getSelectedRows();

    if (this.rowClickSelection) {
      const newSelectedRowIds = selectedRows.map((row) => row.id);
      const rowIdsToRender = Array.from(
        new Set([
          ...this.selectedRowIds.filter((id) => !newSelectedRowIds.includes(id)),
          ...newSelectedRowIds.filter((id) => !this.selectedRowIds.includes(id)),
        ]),
      );
      const rowsToRedraw: IRowNode[] = this.agGrid?.api
        .getRenderedNodes()
        .filter((node) => rowIdsToRender.includes(node.data.id)) as IRowNode[];
      this.selectedRowIds = newSelectedRowIds;
      this.agGrid?.api.redrawRows({ rowNodes: rowsToRedraw });
    }

    this.itemsSelectChange.emit(selectedRows);
  }

  resetColumnDefs(listViewState: ListViewState): void {
    this.listViewState = listViewState;
    this.resetColumnState();
    this.updateColumnPreferences();
  }

  resetColumnState() {
    const firstColumnState = this.agGrid?.api.getColumnState()[0] as ColumnState;
    const colStates = cloneDeep(this.listViewState.getColumnStates());
    if (firstColumnState.colId === 'ag-Grid-SelectionColumn') {
      colStates.unshift(firstColumnState);
    }
    this.agGrid?.api.applyColumnState({
      state: colStates,
      applyOrder: true,
    });
  }

  private updateColumnPreferences() {
    if (this.agGrid) {
      const columnDefs: ColDef[] = this.agGrid.api
        .getAllDisplayedColumns()
        .filter((column) => column.getColDef().colId !== 'ag-Grid-SelectionColumn')
        .map((column) => ({
          ...column.getColDef(),
          width: column.getActualWidth(),
          pinned: column.getPinned(),
        }));

      const columnState: ListViewState = new ListViewState(columnDefs);

      this.listViewStateChange.emit(columnState);
    }
  }

  onColumnHeaderMouseOver() {
    this.makeTextSelectable(false);
  }

  onColumnHeaderMouseLeave() {
    this.makeTextSelectable(true);
  }

  onColumnDragStopped() {
    this.updateColumnPreferences();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const rowSelection = this.agGrid?.gridOptions?.rowSelection as RowSelectionOptions;
    if (event.key === 'Shift' && rowSelection.mode === 'multiRow') {
      this.makeTextSelectable(false);
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    const rowSelection = this.agGrid?.gridOptions?.rowSelection as RowSelectionOptions;
    if (event.key === 'Shift' && rowSelection.mode === 'multiRow') {
      this.makeTextSelectable(true);
    }
  }

  makeTextSelectable(isSelectable: boolean) {
    const elements = this.el.nativeElement.querySelectorAll('.ag-unselectable');
    if (isSelectable) {
      elements.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, '-webkit-touch-callout', 'default');
        this.renderer.setStyle(element, '-webkit-user-select', 'text');
        this.renderer.setStyle(element, '-khtml-user-select', 'text');
        this.renderer.setStyle(element, '-moz-user-select', 'text');
        this.renderer.setStyle(element, '-ms-user-select', 'text');
        this.renderer.setStyle(element, '-o-user-select', 'text');
        this.renderer.setStyle(element, 'user-select', 'text');
      });
    } else {
      elements.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, '-webkit-touch-callout', 'none');
        this.renderer.setStyle(element, '-webkit-user-select', 'none');
        this.renderer.setStyle(element, '-khtml-user-select', 'none');
        this.renderer.setStyle(element, '-moz-user-select', 'moz-none');
        this.renderer.setStyle(element, '-ms-user-select', 'none');
        this.renderer.setStyle(element, '-o-user-select', 'none');
        this.renderer.setStyle(element, 'user-select', 'none');
      });
    }
  }

  /*
   * NOTE: This only deals with the left pinned area because that's all we currently use
   */
  onProcessUnpinnedColumns(params: ProcessUnpinnedColumnsParams) {
    const minUnpinnedAreaWidth = 50;
    const maxPinnedAreaWidth = params.viewportWidth - minUnpinnedAreaWidth;
    const columnsToUnpin: Column<any>[] = [];
    let columnsToUnpinWidth = 0;
    const canUnpin = (col: Column<any>): boolean => {
      const colDef = col.getColDef();
      return (
        col.getColId() !== 'ag-Grid-SelectionColumn' &&
        !colDef.lockPinned &&
        colDef.lockPosition !== true &&
        colDef.lockPosition !== 'left'
      );
    };

    const pinnedColumns = this.agGrid?.api.getDisplayedLeftColumns() || [];
    if (!pinnedColumns) {
      // There is nothing pinned, so nothing can be unpinned
      return [];
    }

    const totalPinnedWidth = pinnedColumns.reduce((runningTotal, col) => runningTotal + col.getActualWidth(), 0);

    // We need to free up this much space in order to have everything fit
    const widthToFree = totalPinnedWidth - maxPinnedAreaWidth;

    for (const col of pinnedColumns) {
      if (canUnpin(col)) {
        columnsToUnpin.push(col);
        columnsToUnpinWidth += col.getActualWidth();

        if (columnsToUnpinWidth >= widthToFree) {
          break;
        }
      }
    }

    return columnsToUnpin;
  }
}
