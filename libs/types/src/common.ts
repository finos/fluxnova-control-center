export enum SortOrderValues {
  desc = 'desc',
  asc = 'asc',
}

export enum DateTimeOperators {
  gt = 'gt',
  lt = 'lt',
}

export interface ItemList<T> {
  totalCount?: number;
  items?: T[];
}

export const MAX_TOTAL_ACT_HIST_ITEMS = 30000;
