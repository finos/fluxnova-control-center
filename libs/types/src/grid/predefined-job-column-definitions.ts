import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams, ToggleFilter } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const predefinedJobColFields = [
  'id',
  'jobDefinitionId',
  //'processInstanceId',
  'processDefinitionKey',
  'exceptionMessage',
  'retries',
  'suspended',
  'failedActivityId',
  'processDefinitionId',
  'dueDate',
  'createTime',
  'priority',
  // 'executionId',
];

export const detailPageJobTabColFields = [
  'id',
  'jobDefinitionId',
  'dueDate',
  'createTime',
  'retries',
  'activityId',
  'activityName',
  'suspended',
  'failedActivityId',
  'priority',
];

export const failedJobColFields = ['id', 'jobDefinitionId', 'createTime', 'exceptionMessage'];

export const jobLogColFields = [
  'id',
  'jobDefinitionType',
  'timestamp',
  'logType',
  'message',
  'jobDefinitionId',
  'hostname',
  'jobRetries',
];

export const remainingJobColFields = ['id', 'jobDefinitionId', 'createTime', 'suspended'];

export const predefinedJobColDefs: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'id',
    headerName: 'Job ID',
    initialWidth: 330,
    cellRendererParams: {
      path: '../process-instances',
      pathParamField: 'processInstanceId',
      queryParamType: 'jobId',
      requiredFieldToEnableLink: 'processInstanceId',
    },
    filterParams: {
      filterFormat: 'textArray',
      filterKeyByComparator: { multi: 'jobIds' },
      comparators: ['multi'],
      sortByKey: 'jobId',
    },
    context: {
      disabledByFilters: [
        {
          field: 'jobDefinitionId',
          displayName: 'Job Definition ID',
        },
        {
          field: 'activityId',
          displayName: 'Activity ID',
        },
      ],
    },
  },
  jobDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.link,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'jobDefinitionId',
    headerName: 'Job Definition ID',
    cellRendererParams: {
      path: '../process-definitions',
      pathParamField: 'processDefinitionId',
      queryParamType: 'jobDefinitionId',
      requiredFieldToEnableLink: 'processDefinitionId',
    },
    initialWidth: 310,
    context: {
      disabledByFilters: [
        {
          field: 'id',
          displayName: 'Job ID',
        },
        {
          field: 'activityId',
          displayName: 'Activity ID',
        },
      ],
    },
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
  processDefinitionKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.smallInitialWidth,
    ...defaultColumnDefsByColType.sortable,
    field: 'processDefinitionKey',
    headerName: 'Process Definition Key',
    initialWidth: 270,
  },
  exceptionMessage: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.clickable,
    field: 'exceptionMessage',
    headerName: 'Exception Message',
    initialWidth: 550,
  },
  failedActivityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'failedActivityId',
    headerName: 'Failed Activity ID',
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'activityId',
    headerName: 'Activity ID',
    context: {
      disabledByFilters: [
        { field: 'id', displayName: 'Job ID' },
        {
          field: 'jobDefinitionId',
          displayName: 'Job Definition ID',
        },
      ],
    },
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
  suspended: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.smallInitialWidth,
    field: 'suspended',
    headerName: 'Suspended',
    filterParams: {
      booleanFilterKeys: ['active', 'suspended'],
      singleFilterOptions: [
        { label: 'True', value: 'suspended' },
        { label: 'False', value: 'active' },
      ],
    },
  },
  priority: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.numberFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'priority',
    headerName: 'Priority',
    filterParams: {
      sortByKey: 'jobPriority',
      filterFormat: 'number',
      comparators: ['lessThanOrEqual', 'greaterThanOrEqual'],
      filterKeyByComparator: { lessThan: 'priorityLowerThanOrEquals', greaterThan: 'priorityHigherThanOrEquals' },
    },
  },
  retries: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.singleSelectFilter,
    ...defaultColumnDefsByColType.xSmallInitialWidth,
    ...defaultColumnDefsByColType.sortable,
    field: 'retries',
    headerName: 'Retries Left',
    filterParams: {
      sortByKey: 'jobRetries',
      booleanFilterKeys: ['withRetriesLeft', 'noRetriesLeft'],
      singleFilterOptions: [
        { label: 'Has Retries Left', value: 'withRetriesLeft' },
        { label: 'Has No Retries Left', value: 'noRetriesLeft' },
      ],
    },
    context: {
      disabledByQueryParams: [
        {
          field: 'withRetriesLeft',
          displayName: 'With Retries Left',
        },
      ],
    },
  },
  dueDate: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    ...defaultColumnDefsByColType.sortable,
    field: 'dueDate',
    headerName: 'Due Time',
    filterParams: {
      dateArrayKey: 'dueDates',
      filterKeyAndValueByComparator: {
        inRange: { lt: 'dateTo', gt: 'dateFrom' },
        before: { lt: 'dateFrom' },
        after: { gt: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      sortByKey: 'jobDueDate',
    },
    initialSort: 'desc',
  },
  createTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    field: 'createTime',
    headerName: 'Create Time',
    filterParams: {
      dateArrayKey: 'createTimes',
      filterKeyAndValueByComparator: {
        inRange: { lt: 'dateTo', gt: 'dateFrom' },
        before: { lt: 'dateFrom' },
        after: { gt: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
    },
  },
};

export const predefinedDetailPageJobTabColDef: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...predefinedJobColDefs['id'],
    cellRenderer: 'truncateWithTooltipRenderer',
  },
  jobDefinitionId: {
    ...predefinedJobColDefs['jobDefinitionId'],
    cellRendererParams: {
      ...predefinedJobColDefs['jobDefinitionId'].cellRendererParams,
      path: '../../process-definitions',
    },
  },
  failedActivityId: {
    ...predefinedJobColDefs['failedActivityId'],
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
  },
};

export const predefinedDetailPageJobLogTabColDef: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...defaultColDefinition,
    headerName: 'Job ID',
    initialWidth: 320,
    field: 'id',
    filterParams: {
      sortByKey: 'jobId',
    },
  },
  jobDefinitionType: {
    ...defaultColDefinition,
    headerName: 'Job Definition Type',
    field: 'jobDefinitionType',
    initialWidth: 200,
  },
  timestamp: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    cellRenderer: 'dateRenderer',
    headerName: 'Timestamp',
    field: 'timestamp',
    initialSort: 'desc',
  },
  logType: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.logType,
    initialWidth: 140,
    headerName: 'Log Type',
    field: 'failureLog',
  },
  message: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.clickable,
    floatingFilter: false,
    headerName: 'Message',
    field: 'jobExceptionMessage',
  },
  jobDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    headerName: 'Job Definition ID',
    field: 'jobDefinitionId',
    initialWidth: 320,
  },
  hostname: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    floatingFilter: false,
    field: 'hostname',
    headerName: 'Hostname',
  },
  jobRetries: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    initialWidth: 100,
    field: 'jobRetries',
    headerName: 'Retries',
  },
};

export const predefinedDetailPageFailedJobTabColDef: Dictionary<ColDefWithFilterParams> = {
  exceptionMessage: {
    ...predefinedJobColDefs['exceptionMessage'],
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
  },
};

export const jobListDefaultToggleFilters = ['withRetriesLeft'];

export const jobListToggleFilters: ToggleFilter[] = [
  new ToggleFilter('executable', 'Ready to be Executed'),
  new ToggleFilter('withRetriesLeft', 'Has Retries Left', [
    {
      field: predefinedJobColDefs.retries.field,
      displayName: predefinedJobColDefs.retries.headerName,
    },
  ]),
  new ToggleFilter('withException', 'Has Exception'),
];
