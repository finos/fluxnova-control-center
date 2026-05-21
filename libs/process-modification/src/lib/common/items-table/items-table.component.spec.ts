import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  Column,
  FilterChangedEvent,
  IRowNode,
  ITooltipParams,
  ProcessUnpinnedColumnsParams,
  RowClassParams,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { ItemType } from '@fxn/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultListViewState } from '../list-utils';
import { ItemsTableComponent } from './items-table.component';

describe('ItemsTableComponent', () => {
  let component: ItemsTableComponent;
  let modalService: NgbModal;
  let fixture: ComponentFixture<ItemsTableComponent>;

  const mockModal = {
    componentInstance: {},
    result: Promise.resolve(true),
  };
  const mockModalService = { init: vi.fn(), open: vi.fn().mockReturnValue(mockModal) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ItemsTableComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: NgbModal,
          useValue: mockModalService,
        },
      ],
    });
    fixture = TestBed.createComponent(ItemsTableComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);
    fixture.detectChanges();
  });

  it('should emit on filter changed', () => {
    const mockEventEmitter = { emit: vi.fn() };
    const mockFilterModel = { filter: 'filterModel' };
    component.columnHeaderFilterChange = mockEventEmitter as any;
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);
    const mockGridEvent: FilterChangedEvent = {
      api: {
        getFilterModel: vi.fn(() => mockFilterModel),
      },
    } as unknown as FilterChangedEvent;
    component.onFilterChanged(mockGridEvent);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(mockFilterModel);
  });

  it('should emit on sort changed', () => {
    const mockEventEmitter = { emit: vi.fn() };
    const mockSortModel = [{ colId: 'name', sort: 'asc' }];
    component.agGrid = {
      api: {
        getAllDisplayedColumns: vi.fn(() => []),
        getColumnState: vi.fn(() => [...mockSortModel, { colId: 'id' }]),
      },
    } as unknown as AgGridAngular;
    component.columnHeaderSortChange = mockEventEmitter as any;
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);
    component.onSortChanged();
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(mockSortModel);
  });

  it('should reset column order, pinned, and widths on resetColumnDefs', () => {
    const selectionColumnState = { colId: 'ag-Grid-SelectionColumn' };
    component.agGrid = {
      api: {
        setGridOption: vi.fn(),
        getAllDisplayedColumns: vi.fn(() => [
          {
            getColDef: vi.fn(() => ({ field: 'id' })),
            getActualWidth: vi.fn(() => 200),
            getPinned: vi.fn(() => 'left'),
          },
        ]),
        applyColumnState: vi.fn(),
        getColumnState: vi.fn(() => [selectionColumnState]),
      },
    } as unknown as AgGridAngular;

    const listView = getDefaultListViewState(ItemType.ProcessInstance);

    component.resetColumnDefs(listView);

    expect(component.agGrid.api.applyColumnState).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.arrayContaining([selectionColumnState].concat(listView.getColumnStates())),
        applyOrder: true,
      }),
    );
  });

  it('should be clickable when the cell has no Exception message or Incident message and doesnt opens the modal', () => {
    const mockCellevent: any = {
      colDef: {
        cellRendererParams: {
          isOpenModalOnClick: true,
        },
        cellClass: 'pointer text-primary',
      },
      data: {
        exceptionMessage: ``,
      },
      value: '',
    };
    vi.spyOn(modalService, 'open');
    component.onCellClicked(mockCellevent);
    expect(modalService.open).not.toHaveBeenCalled();
  });

  it('should be clickable when the cell has Exception message or Incident message and opens a modal', () => {
    const mockCellevent: any = {
      colDef: {
        cellRendererParams: {
          isOpenModalOnClick: true,
        },
        cellClass: 'pointer text-primary',
      },
      data: {
        exceptionMessage: `Unable to evaluate script while executing activity 'Activity_0xv5ebr' in the process definition with id
         'AccountOpening:17:ff854409-b6db-11ed-acee-023d890f59b5':org.graalvm.polyglot.PolyglotException: TypeError: invokeMember (prop)
          on org.finos.fluxnova.spin.impl.xml.dom.DomXmlElement@635ad36c failed due to: Unknown identifier: prop`,
      },
      value: 'Exception Message',
    };
    vi.spyOn(modalService, 'open');
    component.onCellClicked(mockCellevent);
    expect(modalService.open).toHaveBeenCalled();
  });

  it('should prevent highlight on shift down', () => {
    const unselectableElement = document.createElement('div');
    unselectableElement.classList.add('ag-unselectable');
    unselectableElement.style.userSelect = 'text';
    fixture.nativeElement.appendChild(unselectableElement);
    component.agGrid = {
      gridOptions: {
        rowSelection: {
          mode: 'multiRow',
        },
      },
    } as unknown as AgGridAngular;

    vi.spyOn(component, 'onKeyDown');
    vi.spyOn(component, 'makeTextSelectable');

    const keyboardEvent = new KeyboardEvent('keydown', { key: 'Shift' });
    document.dispatchEvent(keyboardEvent);

    expect(component.onKeyDown).toHaveBeenCalled();
    expect(component.makeTextSelectable).toHaveBeenCalledWith(false);
    expect(unselectableElement.style.userSelect).toBe('none');
  });

  it('should allow highlight on shift up', () => {
    const unselectableElement = document.createElement('div');
    unselectableElement.classList.add('ag-unselectable');
    unselectableElement.style.userSelect = 'none';
    fixture.nativeElement.appendChild(unselectableElement);
    component.agGrid = {
      gridOptions: {
        rowSelection: {
          mode: 'multiRow',
        },
      },
    } as unknown as AgGridAngular;
    vi.spyOn(component, 'onKeyUp');
    vi.spyOn(component, 'makeTextSelectable');

    const keyboardEvent = new KeyboardEvent('keyup', { key: 'Shift' });
    document.dispatchEvent(keyboardEvent);

    expect(component.onKeyUp).toHaveBeenCalled();
    expect(component.makeTextSelectable).toHaveBeenCalledWith(true);
    expect(unselectableElement.style.userSelect).toBe('text');
  });

  it('should set isRowSelectable', () => {
    const rowSelectableFn = (row: IRowNode) => row.data.isActive;
    component.isRowSelectable = rowSelectableFn;

    expect(component.gridOptions.rowSelection.isRowSelectable).toBe(rowSelectableFn);
    const mockRow = { data: { isActive: true } } as IRowNode;
    expect(component.gridOptions.rowSelection.isRowSelectable(mockRow)).toBe(true);
  });

  it('should set tooltipValueGetter', () => {
    const tooltipValueFn = (params: ITooltipParams) => (params.value ? `Tooltip: ${params.value}` : null);
    component.getTooltipValue = tooltipValueFn;

    expect(component.gridOptions.selectionColumnDef.tooltipValueGetter).toBe(tooltipValueFn);
    const mockParams = { value: 'Test' } as ITooltipParams;
    expect(component.gridOptions.selectionColumnDef.tooltipValueGetter(mockParams)).toBe('Tooltip: Test');
  });

  it('should set hideDisabledCheckboxes value', () => {
    component.hideDisabledCheckboxes = true;

    expect(component.gridOptions.rowSelection.hideDisabledCheckboxes).toBe(true);
  });

  it('should prevent highlight on mouse over column header', () => {
    const unselectableElement = document.createElement('div');
    unselectableElement.classList.add('ag-unselectable');
    unselectableElement.style.userSelect = 'text';
    fixture.nativeElement.appendChild(unselectableElement);
    component.agGrid = {
      gridOptions: {
        rowSelection: {
          mode: 'multiRow',
        },
      },
    } as unknown as AgGridAngular;

    vi.spyOn(component, 'makeTextSelectable');

    component.onColumnHeaderMouseOver();

    expect(component.makeTextSelectable).toHaveBeenCalledWith(false);
    expect(unselectableElement.style.userSelect).toBe('none');
  });

  it('should allow highlight on mouse leave column header', () => {
    const unselectableElement = document.createElement('div');
    unselectableElement.classList.add('ag-unselectable');
    unselectableElement.style.userSelect = 'text';
    fixture.nativeElement.appendChild(unselectableElement);
    component.agGrid = {
      gridOptions: {
        rowSelection: {
          mode: 'multiRow',
        },
      },
    } as unknown as AgGridAngular;

    vi.spyOn(component, 'makeTextSelectable');

    component.onColumnHeaderMouseLeave();

    expect(component.makeTextSelectable).toHaveBeenCalledWith(true);
    expect(unselectableElement.style.userSelect).toBe('text');
  });

  describe('pinned columns', () => {
    let columns: Column<any>[] = [];

    beforeEach(() => {
      component.agGrid = {
        api: {},
      } as unknown as AgGridAngular;

      columns = [
        {
          colId: 'ag-Grid-SelectionColumn',
          getColId: vi.fn().mockReturnValue('ag-Grid-SelectionColumn'),
          getPinned: vi.fn().mockReturnValue('left'),
          getActualWidth: vi.fn().mockReturnValue(50),
          getColDef: vi.fn().mockReturnValue({
            colId: 'ag-Grid-SelectionColumn',
            lockPinned: true,
            lockPosition: 'left',
          }),
        } as unknown as Column<any>,
        {
          colId: 'id',
          getColId: vi.fn().mockReturnValue('id'),
          getPinned: vi.fn().mockReturnValue('left'),
          getActualWidth: vi.fn().mockReturnValue(100),
          getColDef: vi.fn().mockReturnValue({
            lockPinned: true,
          }),
        } as unknown as Column<any>,
        {
          colId: 'columnA',
          getColId: vi.fn().mockReturnValue('columnA'),
          getPinned: vi.fn().mockReturnValue('left'),
          getActualWidth: vi.fn().mockReturnValue(500),
          getColDef: vi.fn().mockReturnValue({
            lockPosition: false,
          }),
        } as unknown as Column<any>,
        {
          colId: 'columnB',
          getColId: vi.fn().mockReturnValue('columnB'),
          getPinned: vi.fn().mockReturnValue(null),
          getActualWidth: vi.fn().mockReturnValue(500),
          getColDef: vi.fn().mockReturnValue({
            lockPosition: false,
          }),
        } as unknown as Column<any>,
        {
          colId: 'columnC',
          getColId: vi.fn().mockReturnValue('columnC'),
          getPinned: vi.fn().mockReturnValue('left'),
          getActualWidth: vi.fn().mockReturnValue(500),
          getColDef: vi.fn().mockReturnValue({
            lockPosition: false,
          }),
        } as unknown as Column<any>,
      ];
    });

    describe('should not consume the entire width of the grid', () => {
      it('unlocked & unprotected columns should get unpinned left->right', () => {
        component.agGrid = {
          api: {
            getDisplayedLeftColumns: vi.fn(() => columns.filter((col) => col.getPinned() === 'left')),
          },
        } as unknown as AgGridAngular;

        const params: ProcessUnpinnedColumnsParams = {
          columns: [],
          viewportWidth: 550, // width of one of our columns + the 50px min unpinned width
          context: undefined,
          api: component.agGrid.api,
        };

        const result = component.onProcessUnpinnedColumns(params);

        // Ensure that only the expected columns got unpinned.
        // Notably, `id` and 'ag-Grid-SelectionColumn' must NOT be unpinned because:
        //  - ag-Grid-SelectionColumn: explicitly excluded
        //  - id: locked
        expect(result.map((col) => col.getColId())).toEqual(['columnA', 'columnC']);
      });

      it('should return empty list when there are no pinned columns', () => {
        component.agGrid = {
          api: {
            getDisplayedLeftColumns: vi.fn(() => columns.filter((col) => col.getPinned() === 'left')),
          },
        } as unknown as AgGridAngular;

        // unpin all columns
        for (const col of columns) {
          col.getPinned = vi.fn().mockReturnValue(null);
          col.getColDef = vi.fn().mockReturnValue({ lockPosition: false });
        }

        const params: ProcessUnpinnedColumnsParams = {
          columns: [],
          viewportWidth: 550, // width of one of our columns + the 50px min unpinned width
          context: undefined,
          api: component.agGrid.api,
        };

        const result = component.onProcessUnpinnedColumns(params);

        expect(result.map((col) => col.getColId())).toEqual([]);
      });
    });
  });

  it('should set rowClickSelection value on input', () => {
    expect(component.rowClickSelection).toEqual(false);
    expect(component.gridOptions.rowSelection.enableClickSelection).toEqual(false);
    component.rowClickSelection = true;
    expect(component.rowClickSelection).toEqual(true);
    expect(component.gridOptions.rowSelection.enableClickSelection).toEqual(true);
  });

  it('should highlight and redraw row if row id is in selectedIds and rowClickSelection is true', () => {
    component.agGrid = {
      api: {
        getRenderedNodes: vi.fn(() => [{ data: { id: '1' } }, { data: { id: '2' } }, { data: { id: '3' } }]),
        redrawRows: vi.fn(),
      },
    } as unknown as AgGridAngular;
    component.rowClickSelection = true;
    component.onSelectionChanged({
      api: { getSelectedRows: vi.fn(() => [{ id: '1' }]) },
    } as unknown as SelectionChangedEvent);
    expect(component.gridOptions.rowClassRules['row-highlighted']({ data: { id: '1' } } as RowClassParams)).toBe(true);
    expect(component.gridOptions.rowClassRules['row-highlighted']({ data: { id: '2' } } as RowClassParams)).toBe(false);
    expect(component.gridOptions.rowClassRules['row-highlighted']({ data: { id: '3' } } as RowClassParams)).toBe(false);
    expect(component.agGrid.api.redrawRows).toHaveBeenCalledWith({ rowNodes: [{ data: { id: '1' } }] });
    component.onSelectionChanged({
      api: { getSelectedRows: vi.fn(() => [{ id: '2' }, { id: '3' }]) },
    } as unknown as SelectionChangedEvent);
    expect(component.agGrid.api.redrawRows).toHaveBeenCalledWith({
      rowNodes: [{ data: { id: '1' } }, { data: { id: '2' } }, { data: { id: '3' } }],
    });
  });

  it('should not redraw row onSelectionChanged if rowClickSelection is false', () => {
    component.agGrid = {
      api: {
        getRenderedNodes: vi.fn(() => [{ data: { id: '1' } }, { data: { id: '2' } }, { data: { id: '3' } }]),
        redrawRows: vi.fn(),
      },
    } as unknown as AgGridAngular;
    component.onSelectionChanged({
      api: { getSelectedRows: vi.fn(() => [{ id: '1' }]) },
    } as unknown as SelectionChangedEvent);
    expect(component.agGrid.api.redrawRows).toHaveBeenCalledTimes(0);
    component.onSelectionChanged({
      api: { getSelectedRows: vi.fn(() => [{ id: '2' }, { id: '3' }]) },
    } as unknown as SelectionChangedEvent);
    expect(component.agGrid.api.redrawRows).toHaveBeenCalledTimes(0);
  });
});
