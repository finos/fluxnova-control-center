export interface VariableSearchFilter {
  variableName?: string;
  variableNameLike?: string;
  processInstanceIdIn?: string[];
  executionIdIn?: string;
  caseInstanceIdIn?: string;
  caseExecutionIdIn?: string;
  taskIdIn?: string;
  batchIdIn?: string;
  activityInstanceIdIn?: string;
  tenantIdIn?: string[];
  variableValues?: VariableFilter[];
  variableNamesIgnoreCase?: boolean;
  variableValuesIgnoreCase?: boolean;
  sorting?: Sorting[];
}

export interface Sorting {
  sortBy: 'instanceId' | 'variableName' | 'variableType' | 'tenantId';
  sortOrder: 'asc' | 'desc';
}
export interface VariableHistoryFilter {
  firstResult?: number;
  maxResults?: number;
  filter?: VariableSearchFilter;
}

export interface VariableFilter {
  name?: string;
  operator?: string;
  value?: string;
}

export interface VariableValue {
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}
