import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';
import { FilterFormat, GridFilter } from './grid';

export const predefinedIncidentColFields = [
  'id',
  'processInstanceId',
  'incidentMessage',
  'createTime',
  'incidentType',
  'status',
  'failedActivityId',
  'activityId',
  // 'executionId',
  'endTime',
  'processDefinitionId',
  'processDefinitionKey',
  'causeIncidentId',
  'rootCauseIncidentId',
  // 'configuration',
  // 'historyConfiguration',
  'jobDefinitionId',
  // 'rootProcessInstanceId',
  // 'annotation',
  // 'removalTime',
];
export const detailPageIncidentTabColFields = [
  // 'processInstanceId',
  'id',
  'incidentMessage',
  'createTime',
  'incidentType',
  'activityId',
  'activityName',
  'failedActivityId',
  'failedActivityName',
  // 'processDefinitionId',
  // 'processDefinitionKey',
  //'status',
];

export const predefinedIncidentColDefs: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'id',
    headerName: 'Incident ID',
    initialWidth: 330,
    cellRendererParams: {
      path: '../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
    filterParams: {
      filterKeyByComparator: { equals: 'incidentId' },
      comparators: ['equals'],
      sortByKey: 'incidentId',
    },
  },
  processDefinitionKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionKey',
    headerName: 'Definition Key',
    filterParams: {
      filterFormat: 'commaSeparatedList',
      filterKeyByComparator: { multi: 'processDefinitionKeyIn' },
      comparators: ['multi'],
    },
    initialWidth: 270,
  },
  processDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionId',
    headerName: 'Process Definition ID',
    initialWidth: 310,
  },
  processInstanceId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'processInstanceId',
    headerName: 'Process Instance ID',
    initialWidth: 310,
  },
  executionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'executionId',
    headerName: 'Execution ID',
    initialWidth: 310,
  },
  createTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.smallInitialWidth,
    field: 'createTime',
    headerName: 'Create Time',
    initialSort: 'desc',
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          createTimeBefore: 'dateTo',
          createTimeAfter: 'dateFrom',
        },
        before: { createTimeBefore: 'dateFrom' },
        after: { createTimeAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
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
          endTimeBefore: 'dateTo',
          endTimeAfter: 'dateFrom',
        },
        before: { endTimeBefore: 'dateFrom' },
        after: { endTimeAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
  },
  incidentType: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.cellValueMap,
    ...defaultColumnDefsByColType.sortable,
    field: 'incidentType',
    headerName: 'Incident Type',
    filterParams: {
      singleFilterOptions: [
        { label: 'Failed Job', value: 'failedJob' },
        { label: 'Failed External Task', value: 'failedExternalTask' },
      ],
      comparators: ['equals'],
    },
    initialWidth: 130,
    minWidth: 130,
  },
  activityName: {
    ...defaultColDefinition,
    field: 'activityName',
    headerName: 'Activity Name',
    cellRendererParams: {
      sourceField: 'activityId',
    },
    ...defaultColumnDefsByColType.activityNameFromDOM,
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'activityId',
    headerName: 'Activity ID',
  },
  failedActivityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'failedActivityId',
    headerName: 'Failed Activity ID',
  },
  failedActivityName: {
    ...defaultColDefinition,
    field: 'failedActivityName',
    headerName: 'Failed Activity Name',
    cellRendererParams: {
      sourceField: 'failedActivityId',
    },
    ...defaultColumnDefsByColType.activityNameFromDOM,
  },
  causeIncidentId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'causeIncidentId',
    headerName: 'Cause Incident ID',
    cellRendererParams: {
      path: '../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
    initialWidth: 310,
  },
  rootCauseIncidentId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'rootCauseIncidentId',
    headerName: 'Root Cause Incident ID',
    cellRendererParams: {
      path: '../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
    initialWidth: 310,
  },
  configuration: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'configuration',
    headerName: 'Configuration',
  },
  historyConfiguration: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    field: 'historyConfiguration',
    headerName: 'History Configuration',
  },
  incidentMessage: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.clickable,
    field: 'incidentMessage',
    headerName: 'Incident Message',
    filterParams: {
      filterKeyByComparator: { equals: 'incidentMessage', contains: 'incidentMessageLike' },
      comparators: ['contains', 'equals'],
    },
    initialWidth: 310,
    cellRenderer: 'stackTraceRenderer',
  },
  jobDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.multiSelectFilter,
    field: 'jobDefinitionId',
    headerName: 'Job Definition ID',
    filterParams: {
      filterFormat: 'commaSeparatedList',
      comparators: ['multi'],
      filterKeyByComparator: {
        multi: 'jobDefinitionIdIn',
      },
    },
    cellRendererParams: {
      path: '../process-definitions',
      pathParamField: 'processDefinitionId',
      queryParamType: 'jobDefinitionId',
      requiredFieldToEnableLink: 'processDefinitionId',
    },
    initialWidth: 310,
  },
  status: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.booleanCellValueMap,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    field: 'status',
    headerName: 'Status',
    filterParams: {
      sortByKey: 'incidentState',
      booleanFilterKeys: ['open', 'deleted', 'resolved'],
      singleFilterOptions: [
        { label: 'Open', value: 'open' },
        { label: 'Deleted', value: 'deleted' },
        { label: 'Resolved', value: 'resolved' },
      ],
    },
  },
  removalTime: {
    ...defaultColDefinition,
    field: 'removalTime',
    headerName: 'Removal Time',
  },
  rootProcessInstanceId: {
    ...defaultColDefinition,
    field: 'rootProcessInstanceId',
    headerName: 'Root Process Instance ID',
    initialWidth: 310,
  },
  annotation: {
    ...defaultColDefinition,
    field: 'annotation',
    headerName: 'Annotation',
  },
};

export const predefinedIncidentTabColDefs: Dictionary<ColDefWithFilterParams> = {
  ...predefinedIncidentColDefs,
  activityId: {
    ...predefinedIncidentColDefs.activityId,
    initialWidth: 150,
  },
  id: {
    ...predefinedIncidentColDefs.id,
    cellRendererParams: {
      path: '../../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
  },
  processDefinitionId: {
    ...predefinedIncidentColDefs.processDefinitionId,
    cellRendererParams: {
      path: '../../process-definitions',
      pathParamField: 'processDefinitionId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processDefinitionId',
    },
  },
  processInstanceId: {
    ...predefinedIncidentColDefs.processInstanceId,
    cellRendererParams: {
      path: '../../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'incidentId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
  },
  createTime: {
    ...predefinedIncidentColDefs['createTime'],
  },
  incidentMessage: {
    ...defaultColumnDefsByColType.clickable,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    field: 'incidentMessage',
    headerName: 'Incident Message',
    cellRenderer: 'stackTraceRenderer',
  },
};

// Process Instance Detail page incidents tab
// shouldn't have the incident id as a link.
export const predefinedIncidentTabPInstColDefs: Dictionary<ColDefWithFilterParams> = {
  ...predefinedIncidentTabColDefs,
  id: {
    ...predefinedIncidentTabColDefs.id,
    cellRenderer: 'truncateWithTooltipRenderer',
  },
};

export const incidentListDefaultFilters: Dictionary<GridFilter> = {
  status: {
    type: 'equals',
    filter: 'open',
    filterType: 'select' as FilterFormat,
  },
};
