import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType } from './default-column-definition';

export const detailPageJobDefinitionTabColFields = [
  'id',
  'jobType',
  'jobConfiguration',
  'activityId',
  'activityName',
  'suspended',
  'overridingJobPriority',
  //'deploymentId',
];

export const predefinedJobDefinitionColDefs: Dictionary<ColDefWithFilterParams> = {
  id: {
    ...defaultColDefinition,
    field: 'id',
    pinned: 'left',
    lockPosition: true,
    headerName: 'Job Definition ID',
  },
  processDefinitionId: {
    ...defaultColDefinition,
    field: 'processDefinitionId',
    headerName: 'Process Definition ID',
  },
  jobType: {
    ...defaultColDefinition,
    field: 'jobType',
    headerName: 'Job Type',
  },
  jobConfiguration: {
    ...defaultColDefinition,
    field: 'jobConfiguration',
    headerName: 'Job Configuration',
  },
  activityId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.defaultFilter,
    field: 'activityId',
    headerName: 'Activity ID',
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
    field: 'suspended',
    headerName: 'Suspended',
  },
  overridingJobPriority: {
    ...defaultColDefinition,
    field: 'overridingJobPriority',
    headerName: 'Overriding Job Priority',
  },
  deploymentId: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.setWidthToFillRemainingSpace,
    field: 'deploymentId',
    headerName: 'Deployment ID',
  },
};
