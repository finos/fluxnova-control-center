import { ProcessInstanceStatesMap } from '../process-instance-states';
import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams, ToggleFilter } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';
import { FilterFormat, GridFilter } from './grid';

export const predefinedProcessInstanceColFields = [
  'id',
  'processDefinitionName',
  'processDefinitionVersion',
  'startTime',
  'state',
  'businessKey',
  'startUserId',
  'endTime',
  'processDefinitionId',
  'processDefinitionKey',
  'rootProcessInstanceId',
  'superProcessInstanceId',
  'duration',
  // 'superCaseInstanceId',
  // 'caseInstanceId',
];

export const detailPageInstancesTabColFields = [
  'id',
  'state',
  'startTime',
  'endTime',
  'startUserId',
  'businessKey',
  'duration',
];

export const detailCalledProcessInstancesTabColFields = [
  'id',
  'processDefinitionName',
  'activityId',
  'activityName',
  'startTime',
  'endTime',
  'state',
  'startUserId',
  'processDefinitionVersion',
];

export const predefinedProcessInstanceColDefs: { [field: string]: ColDefWithFilterParams } = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    headerName: 'Instance ID',
    field: 'id',
    initialWidth: 330,
    filterParams: {
      filterFormat: 'textArray',
      filterKeyByComparator: { multi: 'processInstanceIds' },
      comparators: ['multi'],
      sortByKey: 'instanceId',
    },
  },
  processDefinitionName: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.xlargeInitialWidth,
    field: 'processDefinitionName',
    headerName: 'Definition Name',
    filterParams: {
      filterKeyByComparator: {
        contains: 'processDefinitionNameLike',
        equals: 'processDefinitionName',
      },
      comparators: ['contains', 'equals'],
      sortByKey: 'definitionName',
    },
    initialWidth: 700,
  },
  processDefinitionVersion: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    ...defaultColumnDefsByColType.xSmallMinWidth,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionVersion',
    headerName: 'Version',
    filterParams: {
      sortByKey: 'definitionVersion',
    },
    initialWidth: 90,
  },
  state: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.largeInitialWidth,
    ...defaultColumnDefsByColType.cellValueMap,
    field: 'state',
    headerName: 'State',
    filterParams: {
      booleanFilterKeys: [
        ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.filterKey,
        ProcessInstanceStatesMap.ACTIVE.filterKey,
        ProcessInstanceStatesMap.SUSPENDED.filterKey,
        ProcessInstanceStatesMap.COMPLETED.filterKey,
        ProcessInstanceStatesMap.INTERNALLY_TERMINATED.filterKey,
        ProcessInstanceStatesMap.UNFINISHED.filterKey,
        ProcessInstanceStatesMap.FINISHED.filterKey,
      ],
      singleFilterOptions: [
        { label: ProcessInstanceStatesMap.ACTIVE.label, value: ProcessInstanceStatesMap.ACTIVE.filterKey },
        { label: ProcessInstanceStatesMap.COMPLETED.label, value: ProcessInstanceStatesMap.COMPLETED.filterKey },
        { label: ProcessInstanceStatesMap.SUSPENDED.label, value: ProcessInstanceStatesMap.SUSPENDED.filterKey },
        {
          label: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.label,
          value: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.filterKey,
        },
        {
          label: ProcessInstanceStatesMap.INTERNALLY_TERMINATED.label,
          value: ProcessInstanceStatesMap.INTERNALLY_TERMINATED.filterKey,
        },
        { label: ProcessInstanceStatesMap.FINISHED.label, value: ProcessInstanceStatesMap.FINISHED.filterKey },
        { label: ProcessInstanceStatesMap.UNFINISHED.label, value: ProcessInstanceStatesMap.UNFINISHED.filterKey },
      ],
      cellValueMapping: [
        { label: ProcessInstanceStatesMap.ACTIVE.label, value: ProcessInstanceStatesMap.ACTIVE.value },
        { label: ProcessInstanceStatesMap.COMPLETED.label, value: ProcessInstanceStatesMap.COMPLETED.value },
        { label: ProcessInstanceStatesMap.SUSPENDED.label, value: ProcessInstanceStatesMap.SUSPENDED.value },
        {
          label: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.label,
          value: ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.value,
        },
        {
          label: ProcessInstanceStatesMap.INTERNALLY_TERMINATED.label,
          value: ProcessInstanceStatesMap.INTERNALLY_TERMINATED.value,
        },
        { label: ProcessInstanceStatesMap.FINISHED.label, value: ProcessInstanceStatesMap.FINISHED.value },
        { label: ProcessInstanceStatesMap.UNFINISHED.label, value: ProcessInstanceStatesMap.UNFINISHED.value },
      ],
    },
    initialWidth: 170,
  },
  startUserId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'startUserId',
    headerName: 'Start User ID',
    filterParams: {
      filterKeyByComparator: { equals: 'startedBy' },
      comparators: ['equals'],
    },
  },
  startTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'startTime',
    headerName: 'Start Time',
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          startedBefore: 'dateTo',
          startedAfter: 'dateFrom',
        },
        before: { startedBefore: 'dateFrom' },
        after: { startedAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
    initialSort: 'desc',
  },
  endTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'endTime',
    headerName: 'End Time',
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          finishedBefore: 'dateTo',
          finishedAfter: 'dateFrom',
        },
        before: { finishedBefore: 'dateFrom' },
        after: { finishedAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
    },
  },
  rootProcessInstanceId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    field: 'rootProcessInstanceId',
    headerName: 'Root Process Instance ID',
    initialWidth: 310,
  },
  businessKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.largeInitialWidth,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'businessKey',
    headerName: 'Instance Business Key',
    filterParams: {
      filterKeyByComparator: {
        contains: 'processInstanceBusinessKeyLike',
        equals: 'processInstanceBusinessKey',
      },
      comparators: ['contains', 'equals'],
      sortByKey: 'businessKey',
    },
  },
  processDefinitionKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionKey',
    headerName: 'Definition Key',
    filterParams: {
      filterKeyByComparator: { multi: 'processDefinitionKeyIn' },
      filterFormat: 'textArray',
      comparators: ['multi'],
      sortByKey: 'definitionKey',
    },
  },
  processDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionId',
    headerName: 'Definition ID',
    filterParams: {
      comparators: ['equals'],
      sortByKey: 'definitionId',
    },
    initialWidth: 310,
  },
  superProcessInstanceId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'superProcessInstanceId',
    headerName: 'Super Process Instance ID',
    filterParams: {
      comparators: ['equals'],
    },
    initialWidth: 310,
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'activityId',
    headerName: 'Activity ID',
  },
  duration: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.sortable,
    field: 'durationInMillis',
    headerName: 'Duration',
  },
};

export const processInstanceListToggleFilters: ToggleFilter[] = [new ToggleFilter('withIncidents', 'With Incidents')];

export const processInstanceListDefaultFilters: Dictionary<GridFilter> = {
  state: {
    type: 'equals',
    filter: 'active',
    filterType: 'select' as FilterFormat,
  },
};

export const processInstanceTabDefaultFilters: Dictionary<GridFilter> = {
  state: {
    type: 'equals',
    filter: 'unfinished',
    filterType: 'select' as FilterFormat,
  },
};

export const predefinedInstanceTabColDefs: { [field: string]: ColDefWithFilterParams } = {
  ...predefinedProcessInstanceColDefs,
  id: {
    ...predefinedProcessInstanceColDefs.id,
    ...defaultColumnDefsByColType.iconLink,
    cellRendererParams: {
      path: '../../process-instances',
      iconIsInternalLink: true,
      iconPathParts: ['../../process-instances', ':id'],
      iconQueryParams: {
        tab: 'incidents',
      },
      iconName: 'warning',
      iconColor: '#dc1616',
      tooltipText: 'Has Incidents',
      displayCondition: (data: any) => data.hasIncidents,
    },
  },
  processDefinitionVersion: {
    ...predefinedProcessInstanceColDefs.processDefinitionVersion,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
  },
};

export const predefinedCalledInstanceTabColDefs: { [field: string]: ColDefWithFilterParams } = {
  ...predefinedProcessInstanceColDefs,
  id: {
    ...predefinedProcessInstanceColDefs.id,
    ...defaultColumnDefsByColType.iconLink,
    cellRendererParams: {
      path: '../../process-instances',
      iconIsInternalLink: true,
      iconPathParts: ['../../process-instances', ':id'],
      iconQueryParams: {
        tab: 'incidents',
      },
      iconName: 'warning',
      iconColor: '#dc1616',
      tooltipText: 'Has Incidents',
      displayCondition: (data: any) => data.hasIncidents,
    },
  },
  processDefinitionVersion: {
    ...predefinedProcessInstanceColDefs.processDefinitionVersion,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
  },
  activityName: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.activityNameFromDOM,
    field: 'activityName',
    headerName: 'Activity Name',
    cellRendererParams: {
      sourceField: 'activityId',
    },
  },
  processDefinitionName: {
    ...predefinedProcessInstanceColDefs.processDefinitionName,
    ...defaultColumnDefsByColType.link,
    floatingFilter: false,
    ...defaultColumnDefsByColType.xlargeInitialWidth,
    headerName: 'Process Definition Name',
  },
};
