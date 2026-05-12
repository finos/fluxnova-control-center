import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams, ToggleFilter } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';
import { FilterFormat, GridFilter } from './grid';

export const predefinedProcessDefColFields = [
  'id',
  'name',
  'version',
  'description',
  'suspended',
  'key',
  'deploymentId',
  'versionTag',
];

export const defaultProcessDefinitionListToggleFilters = ['latestVersion'];

export const predefinedStaticCalledProcessDefColFields = [
  'calledProcessDefinition',
  'state',
  'activityId',
  'activityName',
];

export const predefinedProcessDefinitionColDefs: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'id',
    initialWidth: 330,
    headerName: 'Definition ID',
    filterParams: {
      filterFormat: 'textArray',
      filterKeyByComparator: { multi: 'processDefinitionIdIn' },
      comparators: ['multi'],
    },
  },
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.xlargeInitialWidth,
    ...defaultColumnDefsByColType.sortable,
    field: 'name',
    headerName: 'Definition Name',
    filterParams: {
      filterKeyByComparator: { contains: 'nameLike', equals: 'name' },
      comparators: ['contains', 'equals'],
    },
    initialWidth: 700,
    initialSort: 'asc',
  },
  state: {
    ...defaultColDefinition,
    field: 'state',
    headerName: 'State',
  },
  version: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    ...defaultColumnDefsByColType.versionFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'version',
    headerName: 'Version',
    context: {
      disabledByQueryParams: [
        {
          field: 'latestVersion',
          displayName: 'Latest Version',
        },
      ],
    },
  },
  deploymentId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'deploymentId',
    headerName: 'Deployment ID',
    initialWidth: 310,
    context: {
      disabledByQueryParams: [
        {
          field: 'latestVersion',
          displayName: 'Latest Version',
        },
      ],
    },
  },
  versionTag: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.smallInitialWidth,
    ...defaultColumnDefsByColType.sortable,
    field: 'versionTag',
    headerName: 'Version Tag',
    filterParams: {
      filterKeyByComparator: { equals: 'versionTag', contains: 'versionTagLike' },
      comparators: ['contains', 'equals'],
    },
  },
  description: {
    ...defaultColDefinition,
    field: 'description',
    headerName: 'Description',
    initialWidth: 440,
  },
  key: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'key',
    headerName: 'Definition Key',
    filterParams: {
      filterFormat: 'textArray',
      filterKeyByComparator: { multi: 'keysIn', contains: 'keyLike' },
      comparators: ['contains', 'multi'],
    },
    initialWidth: 330,
  },
  suspended: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.cellValueMap,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.smallInitialWidth,
    field: 'suspended',
    headerName: 'Status',
    filterParams: {
      booleanFilterKeys: ['active', 'suspended'],
      singleFilterOptions: [
        { label: 'Suspended', value: 'suspended' },
        { label: 'Active', value: 'active' },
      ],
      cellValueMapping: [
        { label: 'Suspended', value: true },
        { label: 'Active', value: false },
      ],
    },
  },
  activity: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.activityNameFromDOM,
    field: 'activityName',
    headerName: 'Activity',
    flex: 1,
    floatingFilter: false,
    cellRendererParams: {
      sourceField: 'activityId',
    },
  },
};

export const predefinedStaticCalledProcessDefinitionColDefs: Dictionary<ColDefWithFilterParams> = {
  state: {
    ...predefinedProcessDefinitionColDefs.state,
  },
  activity: {
    ...predefinedProcessDefinitionColDefs.activity,
  },
  calledProcessDefinition: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    field: 'name',
    headerName: 'Called Process Definition',
    flex: 1,
    cellRendererParams: {
      path: '../',
      pathParamField: 'id',
      requiredFieldToEnableLink: 'id',
    },
    floatingFilter: false,
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'activityId',
    headerName: 'Activity ID',
    flex: 1,
  },
  activityName: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.activityNameFromDOM,
    field: 'activityName',
    headerName: 'Activity Name',
    flex: 1,
    floatingFilter: false,
    cellRendererParams: {
      sourceField: 'activityId',
    },
  },
};

export const processDefinitionListDefaultFilters: Dictionary<GridFilter> = {
  suspended: {
    type: 'equals',
    filter: 'active',
    filterType: 'select' as FilterFormat,
  },
};

export const processDefinitionListToggleFilters: ToggleFilter[] = [
  new ToggleFilter('latestVersion', 'Latest Version', [
    {
      field: predefinedProcessDefinitionColDefs.version.field,
      displayName: predefinedProcessDefinitionColDefs.version.headerName,
    },
    {
      field: predefinedProcessDefinitionColDefs.deploymentId.field,
      displayName: predefinedProcessDefinitionColDefs.deploymentId.headerName,
    },
  ]),
];
