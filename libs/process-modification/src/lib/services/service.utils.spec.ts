import {
  defaultColDefinition,
  defaultColumnDefsByColType,
  Dictionary,
  GridFilter,
  GridSort,
  ItemType,
} from '@fxn/types';
import { ColDef } from 'ag-grid-community';
import { describe, expect, it } from 'vitest';
import { getPredefinedColDefs } from '../common/list-utils';
import * as ServiceUtils from './service-utils';

describe('The service-utils', () => {
  describe('transformFilter', () => {
    it('should add % symbols around the filter term and use the "Like" field key when the filter type is contains', () => {
      const filterTerm = 'Fluxnova';
      const gridFilter: GridFilter = {
        filterType: 'text',
        type: 'contains',
        filter: filterTerm,
      };
      const colDef: ColDef = {
        field: 'processDefinitionName',
        filter: 'text',
        filterParams: {
          filterKeyByComparator: {
            contains: 'processDefinitionNameLike',
            equals: 'processDefinitionName',
          },
          comparators: ['contains', 'equals'],
          sortByKey: 'definitionName',
        },
      };

      expect(ServiceUtils.transformFilter('processDefinitionName', gridFilter, colDef)).toEqual({
        processDefinitionNameLike: `%${filterTerm}%`,
      });
    });

    it('should transform a csv into a json array of strings and use the pluralized filterKey when the filter type is multi', () => {
      const filterTerm = '0002adb8-a28c-11ed-a978-0ec9965d7f47,00034d1f-d00a-11ed-976f-0ed5a5c630d5';
      const gridFilter: GridFilter = {
        filterType: 'textArray',
        type: 'multi',
        filter: filterTerm,
      };
      const colDef: ColDef = {
        field: 'processInstanceId',
        filter: 'text',
        filterParams: {
          filterKeyByComparator: {
            multi: 'processInstanceIds',
          },
          comparators: ['multi'],
          sortByKey: 'instanceId',
        },
      };

      expect(ServiceUtils.transformFilter('processInstanceIds', gridFilter, colDef)).toEqual({
        processInstanceIds: filterTerm.split(','),
      });
    });

    it('should use the filter value as the filter key when the value is in the filterKeys array', () => {
      const gridFilter: GridFilter = {
        filterType: 'text',
        type: 'equals',
        filter: 'active',
      };
      const colDef: ColDef = {
        ...defaultColDefinition,
        ...defaultColumnDefsByColType.singleSelectFilter,
        ...defaultColumnDefsByColType.smallInitialWidth,
        field: 'suspended',
        headerName: 'Suspended',
        filterParams: {
          booleanFilterKeys: ['suspended', 'active'],
          singleFilterOptions: [
            { label: 'True', value: 'suspended' },
            { label: 'False', value: 'active' },
          ],
        },
      };

      expect(ServiceUtils.transformFilter('suspended', gridFilter, colDef)).toEqual({
        active: true,
      });
    });

    it('should use the filterKey as the filter key when the value is not in the filterKeys array', () => {
      const gridFilter: GridFilter = {
        filterType: 'text',
        type: 'equals',
        filter: 'active',
      };
      const colDef: ColDef = {
        ...defaultColDefinition,
        ...defaultColumnDefsByColType.singleSelectFilter,
        ...defaultColumnDefsByColType.smallInitialWidth,
        field: 'suspended',
        headerName: 'Suspended',
        filterParams: {
          booleanFilterKeys: ['suspended'],
          singleFilterOptions: [
            { label: 'True', value: 'suspended' },
            { label: 'False', value: 'active' },
          ],
        },
      };

      expect(ServiceUtils.transformFilter('suspended', gridFilter, colDef)).toEqual({
        suspended: false,
      });
    });
  });

  it('should parse the filters, sorting, and page size from query params', () => {
    const queryParameters = {
      filters: `{
        "startTime": { "dateFrom": "2024-11-08T00:00:00.000-0700", "type": "before" },
        "state": { "filter": "active", "type": "equals" }
      }`,
      sorting: '[{"colId":"processDefinitionVersion","sort":"asc"}]',
      toggleFilters: 'withIncidents',
      page: '1',
      pageSize: '25',
    };

    expect(
      ServiceUtils.mapQueryParamsOptions({
        queryParams: queryParameters,
        itemType: ItemType.ProcessInstance,
      }),
    ).toEqual({
      firstResult: 0,
      maxResults: 25,
      sorting: [
        {
          sortBy: 'definitionVersion',
          sortOrder: 'asc',
        },
      ],
      filters: {
        startedBefore: '2024-11-08T00:00:00.000-0700',
        withIncidents: true,
        active: true,
      },
    });
  });

  it('should return one sortBy and sortOrder', () => {
    const sorting = [{ colId: 'evaluationTime', sort: 'desc' }] as GridSort[];
    const predefinedColDefs = getPredefinedColDefs(ItemType.DecisionInstance);

    expect(ServiceUtils.convertSortQueryParamToLoadOptions(sorting, predefinedColDefs)).toEqual([
      {
        sortBy: 'evaluationTime',
        sortOrder: 'desc',
      },
    ]);
  });

  it('should map the generic id to a specific item id depending on colDefs', () => {
    let filters: Dictionary<GridFilter> = {
      id: {
        filter: '123',
        filterType: 'commaSeparatedList',
        type: 'equals',
      },
    };
    const predefinedColDefs = getPredefinedColDefs(ItemType.DecisionInstance);

    expect(ServiceUtils.convertFilterQueryParamToLoadOptions(filters, predefinedColDefs)).toEqual({
      decisionInstanceId: '123',
    });

    filters = {
      id: {
        filter: '123',
        filterType: 'commaSeparatedList',
        type: 'multi',
      },
    };

    expect(ServiceUtils.convertFilterQueryParamToLoadOptions(filters, predefinedColDefs)).toEqual({
      decisionInstanceIdIn: '123',
    });
  });
});
