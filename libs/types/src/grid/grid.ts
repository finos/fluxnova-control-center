import { SortDirection } from 'ag-grid-community';

export type Comparator =
  | 'equals'
  | 'notEqual'
  | 'contains'
  | 'notContains'
  | 'lessThanOrEqual'
  | 'greaterThanOrEqual'
  | 'inRange'
  | 'multi'
  | 'greaterThan'
  | 'lessThan'
  | 'before'
  | 'after';
export type FilterFormat = 'text' | 'number' | 'textArray' | 'commaSeparatedList' | 'stringifiedArray';
/**
 * this interface matches what AgGrid expects for each value in the filtermodel object
 */
export interface GridFilter {
  filter?: string; //this is the value (e.g. user's a# when filtering on assignee)
  filterType?: FilterFormat; //"text", "number" or custom filter control consider rename filterFormat
  type: Comparator; //comparator (e.g. equals, contains) consider rename comparator
  dateFrom?: string;
  dateTo?: string | null;
  defaultValue?: boolean;
}

/**
 * this interface matches what AgGrid expects for each value in a sortmodel object
 */
export interface GridSort {
  colId: string;
  sort: SortDirection;
}

/**
 * this interface matches what AgGrid expects for each value in a sortmodel object
 */
export const FILTER_COMPARATOR_DICTIONARY: { [key: string]: string } = {
  empty: 'Choose One',
  equals: 'Equals',
  notEqual: 'Not equal',
  lessThan: 'Less than',
  greaterThan: 'Greater than',
  inRange: 'In range',
  lessThanOrEqual: 'Less than or equals',
  greaterThanOrEqual: 'Greater than or equals',
  rangeStart: 'From',
  rangeEnd: 'To',
  contains: 'Contains',
  notContains: 'Not contains',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  selectAll: 'Select All',
  applyFilter: 'Apply Filter',
  clearFilter: 'Clear Filter',
  andCondition: 'AND',
  orCondition: 'OR',
  multi: 'Multiselect',
  before: 'Before',
  after: 'After',
};
