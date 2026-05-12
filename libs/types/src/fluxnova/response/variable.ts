export interface VariableValueInfo {
  objectTypeName?: string;
  serializationDataFormat?: string;
  mimetype?: string;
  filename?: string;
  encoding?: string;
}

export interface Variable {
  id: string;
  name: string;
  type?: FluxnovaVariableTypes;
  value?: string | null;
  valueInfo?: VariableValueInfo;
  processDefinitionId?: string;
  processInstanceId?: string;
  executionId?: string;
  caseInstanceId?: string;
  caseExecutionId?: string;
  taskId?: string;
  batchId?: string;
  activityInstanceId?: string;
  tenantId?: string;
  errorMessage?: string;
  scopeType?: VariableScopeType;
}

export enum FluxnovaVariableTypes {
  Boolean = 'Boolean',
  Bytes = 'Bytes',
  Short = 'Short',
  Integer = 'Integer',
  Long = 'Long',
  Double = 'Double',
  Date = 'Date',
  String = 'String',
  Null = 'Null',
  Object = 'Object',
  Json = 'Json',
  Xml = 'Xml',
}

export enum VariableScopeType {
  Process = 'Process',
  Activity = 'Activity',
}
