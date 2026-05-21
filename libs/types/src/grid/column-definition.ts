import { ColDef } from 'ag-grid-community';
import { Comparator, FilterFormat } from './grid';

export interface ColDefWithFilterParams extends ColDef {
  field: string;
  headerName: string;
  filter?: GridRendererComponentKey;
  floatingFilterComponent?: GridRendererComponentKey;
  filterParams?: {
    dateArrayKey?: string;
    filterFormat?: FilterFormat;
    isMultiSelect?: boolean;
    comparators?: Array<Comparator>;
    disableSanitize?: boolean;
    inRangeInclusive?: boolean;
    sortByKey?: string;
    allowedCharPattern?: string;
    filterKeyByComparator?: { [comparator: string]: string };
    filterKeyAndValueByComparator?: {
      [comparator: string]: { [comparator: string]: FilterValueKey };
    }; // i.e. {lessThan: {startedBefore:'dateFrom'} with colFilter: {type: 'lessThan', dateFrom: 'mockDate'} becomes {startedBefore: 'mockDate'}
    booleanFilterKeys?: string[]; // i.e. ['suspended'] becomes {suspended: true}
    singleFilterOptions?: LabelAndValueObject[];
    cellValueMapping?: LabelAndValueObject[];
  };
  context?: {
    disabledByFilters?: FilterDisable[];
    disabledByQueryParams?: FilterDisable[];
  };
}

export type FilterValueKey = 'filter' | 'dateTo' | 'dateFrom';

export type GridRendererComponentKey =
  | 'linkRenderer'
  | 'iconLinkRenderer'
  | 'batchProgressRenderer'
  | 'jobStateRenderer'
  | 'dateRenderer'
  | 'addButtonFloatingFilter'
  | 'editControlsRenderer'
  | 'textWithLabelRenderer'
  | 'truncateWithTooltipRenderer'
  | 'agColumnHeader'
  | 'agDateInput'
  | 'multiSelectFloatingFilter'
  | 'singleSelectFloatingFilter'
  | 'dateInputFloatingFilter'
  | 'defaultFloatingFilter'
  | 'versionFloatingFilter'
  | 'stackTraceRenderer'
  | 'activityNameFromDOMRenderer';

export interface LabelAndValueObject {
  label: string;
  value: string | boolean;
}

export interface FilterDisable {
  field: string;
  displayName: string;
}

export interface IToggleFilter {
  field: string;
  headerName: string;
  selected?: boolean;
  isDisabled?: boolean;
  disabledByQueryParams?: FilterDisable[];
  disabledTooltip?: string;
}

export class ToggleFilter implements IToggleFilter {
  constructor(
    public readonly field: string,
    public readonly headerName: string,
    public readonly disabledByQueryParams: FilterDisable[] = [],
    public selected: boolean = false,
    public isDisabled: boolean = false,
  ) {}

  public get disabledTooltip() {
    const filters = this.disabledByQueryParams.map((filterDisable) => filterDisable.displayName ?? filterDisable.field);
    const lastFilter = filters.pop();
    const prefix =
      filters.length > 1 ? `${filters.join(', ')}, and/or ` : filters.length === 1 ? `${filters[0]} and/or ` : '';

    return lastFilter ? `Disabled while ${prefix}${lastFilter ?? ''} is in use` : '';
  }
}
