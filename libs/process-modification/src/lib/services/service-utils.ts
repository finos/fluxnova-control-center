import { Params } from '@angular/router';
import { jsonParseSafe } from '@fxn/common';
import { defaultPageSize } from '@fxn/grid';
import {
  ColumnDefinitions,
  Dictionary,
  FilterFormat,
  FilterValueKey,
  GridFilter,
  GridSort,
  HistoricalProcessInstanceFilter,
  ItemType,
  ListSortParams,
  ProcessDefinitionFilter,
  SortOrderValues,
  ToggleFilter,
} from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { isEmpty, map, mapValues, reduce } from 'lodash-es';
import { getItemListToggleFilters, getPredefinedColDefs } from '../common/list-utils';

export interface QueryParamOptions {
  queryParams: Params;
  itemType: ItemType;
}

export function mapQueryParamsOptions(opts: QueryParamOptions) {
  const predefinedColDefs: ColumnDefinitions = getPredefinedColDefs(opts.itemType);
  const presetToggleFilters = getItemListToggleFilters(opts.itemType);

  if (isEmpty(predefinedColDefs)) return {};

  const page: number | undefined = opts.queryParams?.page ? parseInt(opts.queryParams?.page, 10) : 1;

  const pageSize: number | undefined = opts.queryParams?.pageSize
    ? parseInt(opts.queryParams?.pageSize, 10)
    : defaultPageSize;

  const sorting = opts.queryParams.sortBy
    ? [{ colId: opts.queryParams.sortBy, sort: opts.queryParams.sortOrder }]
    : jsonParseSafe<any>(opts.queryParams?.sorting?.length > 0 ? opts.queryParams?.sorting : {});

  return {
    sorting: convertSortQueryParamToLoadOptions(sorting, predefinedColDefs),
    filters: {
      ...convertFilterQueryParamToLoadOptions(jsonParseSafe(opts.queryParams.filters) ?? {}, predefinedColDefs),
      ...convertToggleFilterQueryParamToLoadOptions(
        opts.queryParams.toggleFilters?.split(',') ?? [],
        presetToggleFilters ?? [],
      ),
    },
    firstResult: (page - 1) * pageSize,
    maxResults: pageSize,
  };
}

export function convertSortQueryParamToLoadOptions(
  sortQueryParam: GridSort[],
  colDefs: Dictionary<ColDef>,
): ListSortParams[] | undefined {
  if (sortQueryParam?.length) {
    return map(sortQueryParam, (queryParam) => ({
      sortBy: `${transformSortBy(queryParam.colId, colDefs[queryParam.colId])}` as ListSortParams['sortBy'],
      sortOrder: (<SortOrderValues>queryParam.sort) as ListSortParams['sortOrder'],
    }));
  }
  return;
}

export function convertFilterQueryParamToLoadOptions(
  filterQueryParam: Dictionary<GridFilter>,
  colDefs: Dictionary<ColDef>,
): ProcessDefinitionFilter | HistoricalProcessInstanceFilter | undefined {
  if (!isEmpty(filterQueryParam)) {
    return reduce(
      filterQueryParam,
      (res, colFilter, key) => {
        const transformedFilter = transformFilter(key, colFilter, colDefs[key]);
        return {
          ...res,
          ...transformedFilter,
        };
      },
      {},
    );
  }
  return;
}

export function transformSortBy(fieldName: string, colDef?: ColDef): string {
  return colDef?.filterParams?.sortByKey || fieldName;
}

export function convertToggleFilterQueryParamToLoadOptions(
  toggleFilters: string[],
  validToggleFilters: ToggleFilter[],
): { [key: string]: string | boolean } | undefined {
  const validFilterKeys = toggleFilters.filter((toggle) => !!validToggleFilters.find((x) => x.field === toggle));
  const transformedToggleFilter = validFilterKeys.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: true,
    }),
    {},
  );
  if (!isEmpty(transformedToggleFilter)) {
    return transformedToggleFilter;
  }
  return;
}

export function transformFilter(
  fieldName: string,
  colFilter: GridFilter,
  colDef?: ColDef,
): { [key: string]: string | boolean | [] | { operator: string; value: string }[] } | undefined {
  if (colFilter.filter) {
    if (colDef?.filterParams.booleanFilterKeys?.length) {
      // If we have a boolean filter type, look at the value
      // of the filter and see if it matches a key that's been defined.
      // If it has, then we know it's true.  EG: The user selects "open"
      // from the dropdown and "open" is a filterKey.  This means the user
      // wants to see open items which means "open=true".
      //
      // If the value is not in the filterKeys array, then we know
      // that the key is false. EG: The user selects "active" from the list
      // but the only key in the filterKeys array is "suspended".  This then
      // should equate to "suspended=false" and not "active=true".
      if (colDef?.filterParams.booleanFilterKeys.indexOf(colFilter.filter) > -1)
        return {
          [colFilter.filter]: true,
        };
      else
        return {
          [colDef?.filterParams.booleanFilterKeys[0]]: false,
        };
    }
    return {
      [colDef?.filterParams.filterKeyByComparator?.[colFilter.type] || fieldName]: getFilterValue(
        colFilter.type,
        colFilter.filter || '',
        colFilter.filterType,
      ),
    };
  }
  if (colFilter.dateFrom) {
    if (colDef?.filterParams?.dateArrayKey) {
      return getDateArrayFilter(colFilter, colDef);
    } else if (colDef?.filterParams?.filterKeyAndValueByComparator) {
      return getDateFilterByComparator(colFilter, colDef);
    }
  }
  //TODO handle bad filter data

  // console.error('unhandled/unknown filter, ignoring filter', { fieldName, colFilter, colDef });
  return;
}

function getFilterValue(comparator: string, value: any, filterFormat?: FilterFormat): string | boolean | [] {
  switch (comparator) {
    case 'contains':
      return `%${value}%`;
    case 'boolean':
      return JSON.parse(value);
    case 'multi':
      return getFilterFormatted(value, filterFormat);
    default:
      return value;
  }
}

function getFilterFormatted(value: any, filterFormat?: FilterFormat) {
  switch (filterFormat) {
    case 'textArray':
      return value.split(',');
    case 'stringifiedArray':
      return JSON.stringify(value.split(','));
    case 'commaSeparatedList':
    default:
      return value;
  }
}

function getDateArrayFilter(
  colFilter: GridFilter,
  colDef?: ColDef,
): { [key: string]: string | boolean | [] | { operator: string; value: string }[] } | undefined {
  const filterKeyAndValue = colDef?.filterParams.filterKeyAndValueByComparator?.[colFilter.type];
  if (!filterKeyAndValue) {
    return undefined;
  }
  const dateOperatorAndValueArray: { operator: string; value: string }[] = Object.keys(filterKeyAndValue).map(
    (operator) => ({ operator, value: colFilter[filterKeyAndValue[operator] as FilterValueKey] || '' }),
  );
  return {
    [colDef?.filterParams.dateArrayKey]: dateOperatorAndValueArray,
  };
}

function getDateFilterByComparator(colFilter: GridFilter, colDef?: ColDef) {
  const filterKeyAndValue = colDef?.filterParams.filterKeyAndValueByComparator?.[colFilter.type];

  const dateFilterByFilterKey: { [filterKey: string]: string } = mapValues(
    filterKeyAndValue,
    (filterValueKey) => colFilter[filterValueKey as FilterValueKey] || '',
  );
  return dateFilterByFilterKey;
}
