import { ColDef, ColumnState } from 'ag-grid-community';
import { ColDefWithFilterParams } from './grid';

export class ListViewState {
  public getColumnStates(): ColumnState[] {
    return this.columnDefs.map((colDef) => ({
      colId: colDef.colId ?? colDef.field ?? '',
      width: colDef.width || colDef.initialWidth || undefined,
      flex: colDef.flex || undefined,
      pinned: colDef.pinned || null,
    }));
  }

  constructor(public readonly columnDefs: ColDef[] = []) {}
}

export interface ColumnDefinitions {
  [id: string]: ColDefWithFilterParams;
}
