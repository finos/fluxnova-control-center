import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams, ToggleFilter } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';
import { GridFilter } from './grid';

export const decisionDefinitionColFields = ['id', 'name', 'version', 'key', 'deploymentId'];

export const decisionDefinitionColDefs: { [field: string]: ColDefWithFilterParams } = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.link,
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'ID',
    field: 'id',
  },
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    filterParams: {
      comparators: ['contains'],
      filterKeyByComparator: {
        contains: 'nameLike',
      },
    },
    context: {
      disabledByQueryParams: [
        {
          field: 'latestVersion',
          displayName: 'Latest Version',
        },
      ],
    },
    headerName: 'Name',
    field: 'name',
  },
  version: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.versionFilter,
    headerName: 'Version',
    field: 'version',
    context: {
      disabledByQueryParams: [
        {
          field: 'latestVersion',
          displayName: 'Latest Version',
        },
      ],
    },
  },
  key: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.defaultFilter,
    filterParams: {
      comparators: ['contains'],
      filterKeyByComparator: {
        contains: 'keyLike',
      },
    },
    headerName: 'Definition Key',
    field: 'key',
    initialSort: 'asc',
  },
  deploymentId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.defaultFilter,
    context: {
      disabledByQueryParams: [
        {
          field: 'latestVersion',
          displayName: 'Latest Version',
        },
      ],
    },
    headerName: 'Deployment ID',
    field: 'deploymentId',
  },
};

export const decisionDefinitionListDefaultFilters: Dictionary<GridFilter> = {};

export const decisionDefinitionListToggleFilters: ToggleFilter[] = [
  new ToggleFilter('latestVersion', 'Latest Version', [
    {
      field: decisionDefinitionColDefs.version.field,
      displayName: decisionDefinitionColDefs.version.headerName,
    },
    {
      field: decisionDefinitionColDefs.name.field,
      displayName: decisionDefinitionColDefs.name.headerName,
    },
    {
      field: decisionDefinitionColDefs.deploymentId.field,
      displayName: decisionDefinitionColDefs.deploymentId.headerName,
    },
  ]),
];

export const decisionDefinitionDefaultToggleFilters: string[] = ['latestVersion'];
