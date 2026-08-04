import { FluxnovaVariableTypes, Variable, VariableScopeType } from '@fxn/types';

export const complexFluxnovaVariableTypes = [{ type: 'File' }, { type: 'Object' }, { type: 'Json' }, { type: 'Xml' }];

export const simpleFluxnovaVariableTypes = [
  { type: 'Boolean' },
  { type: 'Date' },
  { type: 'Double' },
  { type: 'Integer' },
  { type: 'Long' },
  { type: 'Null' },
  { type: 'Short' },
  { type: 'String' },
];

const variablesTypes = [
  'Boolean',
  'Date',
  'Double',
  'String',
  'Object',
  'Bytes',
  'Short',
  'Integer',
  'Long',
  'Null',
  'File',
  'Json',
  'Xml',
];

export function createMockFluxnovaVariables(amount: number, types: string[] = variablesTypes): Variable[] {
  const variables: Variable[] = [];
  for (let index = 0; index < amount; index++) {
    variables.push({
      id: index.toString(),
      activityInstanceId: '',
      batchId: '',
      caseExecutionId: '',
      caseInstanceId: '',
      errorMessage: '',
      executionId: '',
      name: `variable#${index}`,
      processDefinitionId: '1',
      processInstanceId: 'abcd1234',
      taskId: '',
      tenantId: '',
      type: types[index] as FluxnovaVariableTypes,
      value: undefined,
      valueInfo: {
        objectTypeName: types[index] === 'Object' ? 'any/class/path' : '',
        serializationDataFormat: '',
      },
      scopeType: VariableScopeType.Process,
    });
  }
  return variables;
}
