import { ColumnState } from 'ag-grid-community';
import { Dictionary } from './dictionary';
import { GridFilter, GridSort } from './grid';

export interface LocalStorageColumnPrefData {
  columnState: ColumnState[];
  differentThanDefaults: boolean;
}

export interface SavedSortAndFilterData {
  filters: Dictionary<GridFilter> | undefined;
  sorting: GridSort[] | undefined;
  toggleFilters?: string;
}
