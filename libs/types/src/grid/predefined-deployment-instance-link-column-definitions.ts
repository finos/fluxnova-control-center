import { Dictionary } from '../dictionary';
import { ColDefWithFilterParams } from './column-definition';
import { defaultColDefinition, defaultColumnDefsByColType, noFilterNoSortColDef } from './default-column-definition';

export const BPMN_COLUMN_DEFINITIONS: Dictionary<ColDefWithFilterParams> = {
  processDefinitionName: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...noFilterNoSortColDef,
    colId: 'processDefinitionName',
    headerName: 'Name',
    field: 'processDefinitionName',
    flex: 1,
  },
  key: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'key',
    field: 'key',
    headerName: 'Key',
    flex: 1,
  },
  instanceCount: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'instanceCount',
    field: 'instanceCount',
    headerName: 'Instance Count',
  },
};

export const deploymentDecisionRequirementsDefinitionsColumnDefinitions: Dictionary<ColDefWithFilterParams> = {
  name: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'name',
    headerName: 'Name',
    field: 'name',
    flex: 1,
  },
  key: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'key',
    field: 'key',
    headerName: 'Key',
    flex: 1,
  },
  version: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'version',
    field: 'version',
    headerName: 'Version',
  },
};

export const deploymentDecisionDefinitionColumnDefinitions: Dictionary<ColDefWithFilterParams> = {
  name: {
    ...defaultColDefinition,
    ...defaultColumnDefsByColType.link,
    ...noFilterNoSortColDef,
    colId: 'name',
    headerName: 'Name',
    cellRendererParams: {
      path: '../../decision-definitions',
      pathParamField: 'id',
    },
    field: 'name',
    flex: 1,
  },
  key: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'key',
    field: 'key',
    headerName: 'Key',
    flex: 1,
  },
  version: {
    ...defaultColDefinition,
    ...noFilterNoSortColDef,
    colId: 'version',
    field: 'version',
    headerName: 'Version',
  },
};
