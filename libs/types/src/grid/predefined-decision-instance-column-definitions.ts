import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

const processFields: { [field: string]: ColDefWithFilterParams } = {
  processDefinitionId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    ...defaultColumnDefsByColType.link,
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'Process Definition ID',
    field: 'processDefinitionId',
    cellRendererParams: { path: '../../process-definitions', pathParamField: '' },
  },
  processDefinitionKey: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    headerName: 'Process Definition Key',
    field: 'processDefinitionKey',
  },
};

export const decisionInstanceDefaultColDefs: { [field: string]: ColDefWithFilterParams } = {
  id: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.id,
    ...defaultColumnDefsByColType.multiSelectFilter,
    ...defaultColumnDefsByColType.link,
    cellRendererParams: {
      pathParts: ['../..', 'decision-definitions', ':decisionDefinitionId', 'instances', ':id'],
    },
    filterParams: {
      filterFormat: 'commaSeparatedList',
      filterKeyByComparator: { equals: 'decisionInstanceId', multi: 'decisionInstanceIdIn' },
      comparators: ['equals', 'multi'],
    },
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'ID',
    field: 'id',
  },
  evaluationTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.sortable,
    ...defaultColumnDefsByColType.date,
    ...defaultColumnDefsByColType.dateFilter,
    filterParams: {
      filterKeyAndValueByComparator: {
        inRange: {
          evaluatedBefore: 'dateTo',
          evaluatedAfter: 'dateFrom',
        },
        before: { evaluatedBefore: 'dateFrom' },
        after: { evaluatedAfter: 'dateFrom' },
      },
      comparators: ['inRange', 'before', 'after'],
      inRangeInclusive: true,
    },
    initialSort: 'desc',
    initialWidth: 200,
    headerName: 'Evaluation Time',
    field: 'evaluationTime',
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'activityId',
    headerName: 'Activity ID',
  },
  callingInstanceId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    initialWidth: 330, // Wide enough for a GUID
    headerName: 'Calling Instance ID',
    field: 'rootProcessInstanceId',
    cellRendererParams: { path: '../../process-instances', pathParamField: '' },
  },
};

export const decisionInstanceAllColsColDefs: { [field: string]: ColDefWithFilterParams } = {
  ...decisionInstanceDefaultColDefs,
  ...processFields,
};
