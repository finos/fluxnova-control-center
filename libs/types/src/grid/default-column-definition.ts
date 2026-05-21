import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { ColDefWithFilterParams, LabelAndValueObject } from './column-definition';

export const defaultColDefinition: ColDef = {
  floatingFilter: true,
  resizable: true,
  sortable: false,
  suppressFloatingFilterButton: true,
  cellRenderer: 'truncateWithTooltipRenderer',
  initialWidth: 200,
  rowDrag: false,
  suppressKeyboardEvent: () => true,
  minWidth: 100,
  cellDataType: false,
  comparator: () => 0,
};

export const noFilterNoSortColDef: ColDef = {
  floatingFilter: false,
  sortable: false,
};

export type colType =
  | 'id'
  | 'iconLink'
  | 'link'
  | 'date'
  | 'batchProgress'
  | 'logType'
  | 'cellValueMap'
  | 'booleanCellValueMap'
  | 'clickable'
  | 'editControls'
  | 'textWithLabel'
  | 'sortable'
  | 'singleSelectFilter'
  | 'defaultFilter'
  | 'numberFilter'
  | 'versionFilter'
  | 'multiSelectFilter'
  | 'dateFilter'
  | 'xxSmallInitialWidth'
  | 'xSmallInitialWidth'
  | 'smallInitialWidth'
  | 'mediumInitialWidth'
  | 'largeInitialWidth'
  | 'xlargeInitialWidth'
  | 'xSmallMinWidth'
  | 'setWidthToFillRemainingSpace'
  | 'activityNameFromDOM';

export const defaultColumnDefsByColType: Record<colType, Partial<ColDefWithFilterParams>> = {
  id: {
    pinned: 'left',
    lockPosition: true,
  },
  link: {
    cellRenderer: 'linkRenderer',
  },
  iconLink: {
    cellRenderer: 'iconLinkRenderer',
  },
  date: {
    cellRenderer: 'dateRenderer',
  },
  batchProgress: {
    cellRenderer: 'batchProgressRenderer',
  },
  logType: {
    cellRenderer: 'jobStateRenderer',
  },
  clickable: {
    cellRendererParams: {
      isOpenModalOnClick: true,
    },
    cellClass: 'pointer text-primary',
  },
  editControls: {
    cellRenderer: 'editControlsRenderer',
  },
  textWithLabel: {
    cellRenderer: 'textWithLabelRenderer',
    cellRendererParams: {
      label: '',
    },
  },
  cellValueMap: {
    valueGetter: (params: ValueGetterParams) => {
      const currentValue = params.data[params.colDef.field || ''];
      const options = params.colDef.filterParams?.cellValueMapping || params.colDef.filterParams?.singleFilterOptions;
      const currentOption = options?.find((x: { label: string; value: string }) => x.value === currentValue);
      return currentOption?.label || currentValue;
    },
  },
  booleanCellValueMap: {
    valueGetter: (params: ValueGetterParams) => {
      const options: LabelAndValueObject[] =
        params.colDef.filterParams?.cellValueMapping || params.colDef.filterParams?.singleFilterOptions;
      let mappedValue = '';
      options.forEach((option) => {
        if (params.data?.[option.value as string] === true) {
          mappedValue = option.label;
        }
      });
      return mappedValue;
    },
  },
  sortable: {
    sortable: true,
  },
  defaultFilter: {
    filter: 'defaultFloatingFilter',
    floatingFilterComponent: 'defaultFloatingFilter',
    filterParams: {
      comparators: ['equals'],
    },
  },
  singleSelectFilter: {
    floatingFilterComponent: 'singleSelectFloatingFilter',
    filter: 'singleSelectFloatingFilter',
  },
  numberFilter: {
    filter: 'defaultFloatingFilter',
    floatingFilterComponent: 'defaultFloatingFilter',
    filterParams: {
      filterFormat: 'number',
      allowedCharPattern: '\\d',
      comparators: ['equals'],
    },
  },
  versionFilter: {
    filter: 'versionFloatingFilter',
    floatingFilterComponent: 'versionFloatingFilter',
    filterParams: {
      filterFormat: 'number',
      allowedCharPattern: '\\d',
      comparators: ['equals'],
    },
  },
  multiSelectFilter: {
    filter: 'multiSelectFloatingFilter',
    floatingFilterComponent: 'multiSelectFloatingFilter',
  },
  dateFilter: {
    filter: 'dateInputFloatingFilter',
    floatingFilterComponent: 'dateInputFloatingFilter',
  },
  xxSmallInitialWidth: {
    initialWidth: 40,
    minWidth: 40,
  },
  xSmallInitialWidth: {
    initialWidth: 110,
  },
  smallInitialWidth: {
    initialWidth: 150,
  },
  mediumInitialWidth: {
    initialWidth: 170,
  },
  largeInitialWidth: {
    initialWidth: 220,
  },
  xlargeInitialWidth: {
    initialWidth: 320,
  },
  xSmallMinWidth: {
    minWidth: 50,
  },
  setWidthToFillRemainingSpace: {
    flex: 1,
  },
  activityNameFromDOM: {
    cellRenderer: 'activityNameFromDOMRenderer',
  },
};
