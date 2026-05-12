import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const detailPageHistoryTabColFields = [
  'startTime',
  'endTime',
  'duration',
  'name',
  'type',
  'entityType',
  'userId',
  'executionId',
  'operationType',
  'data',
  'details',
];

export const predefinedHistoryColDefs: Dictionary<ColDefWithFilterParams> = {
  executionId: {
    ...defaultColDefinition,
    field: 'executionId',
    headerName: 'Execution ID',
  },
  activityId: {
    ...defaultColDefinition,
    field: 'activityId',
    headerName: 'Activity ID',
  },
  type: {
    ...defaultColDefinition,
    field: 'type',
    headerName: 'History Type',
  },
  entityType: {
    ...defaultColDefinition,
    field: 'entityType',
    headerName: 'Entity Type',
  },
  name: {
    ...defaultColDefinition,
    field: 'name',
    headerName: 'Task/Event Name',
  },
  startTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    field: 'startTime',
    headerName: 'Start Time',
  },
  endTime: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.date,
    field: 'endTime',
    headerName: 'End Time',
  },
  duration: {
    ...defaultColDefinition,
    field: 'duration',
    headerName: 'Duration',
  },
  operationType: {
    ...defaultColDefinition,
    field: 'operationType',
    headerName: 'Operation',
  },
  data: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.textWithLabel,
    cellRendererParams: {
      labelField: 'dataLabel',
      isOpenModalOnClick: true,
    },
    field: 'data',
    headerName: 'Data',
  },
  details: {
    ...defaultColDefinition,
    field: 'details',
    cellRendererParams: {
      isOpenModalOnClick: true,
    },
    headerName: 'Details',
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    cellClass: 'text-primary',
  },
  taskId: {
    ...defaultColDefinition,
    field: 'taskId',
    headerName: 'Task ID',
  },
  userOperationId: {
    ...defaultColDefinition,
    field: 'userOperationId',
    headerName: 'User Operation ID',
  },
  userId: {
    ...defaultColDefinition,
    field: 'userId',
    headerName: 'User',
  },
  variableName: {
    ...defaultColDefinition,
    field: 'variableName',
    headerName: 'Variable Name',
  },
};
