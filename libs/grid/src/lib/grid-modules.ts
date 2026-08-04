import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  EventApiModule,
  Module,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  TextFilterModule,
} from 'ag-grid-community';

export const AG_GRID_MODULES: Module[] = [
  ClientSideRowModelModule,
  RowSelectionModule,
  RowStyleModule,
  TextFilterModule,
  ColumnApiModule,
  EventApiModule,
  CellStyleModule,
  RowApiModule,
];
