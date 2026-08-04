import { SortOrderValues } from '../../common';
import { VariableFilter } from './variable';

export interface ProcessInstanceFilter {
  processInstanceIds?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
}

enum ProcessInstanceSortByFields {
  instanceId = 'instanceId',
  definitionId = 'definitionId',
  definitionKey = 'definitionKey',
  definitionName = 'definitionName',
  definitionVersion = 'definitionVersion',
  businessKey = 'businessKey',
  startTime = 'startTime',
  endTime = 'endTime',
  duration = 'duration',
  tenantId = 'tenantId',
}

class ProcessInstanceSortParams {
  sortBy?: ProcessInstanceSortByFields;
  sortOrder?: SortOrderValues;
}

export interface HistoricalProcessInstanceFilter {
  processInstanceId?: string;
  processInstanceIds?: string[];
  processInstanceBusinessKey?: string;
  processInstanceBusinessKeyLike?: string;
  rootProcessInstances?: boolean;
  superProcessInstanceId?: string;
  subProcessInstanceId?: string;
  superCaseInstanceId?: string;
  subCaseInstanceId?: string;
  caseInstanceId?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processDefinitionKeyIn?: string[];
  processDefinitionKeyNotIn?: string[];
  processDefinitionName?: string;
  processDefinitionNameLike?: string;
  finished?: boolean;
  unfinished?: boolean;
  withIncidents?: boolean;
  withRootIncidents?: boolean;
  incidentType?: string;
  incidentStatus?: string;
  incidentMessage?: string;
  incidentMessageLike?: string;
  startedBy?: string;
  startedBefore?: string;
  startedAfter?: string;
  finishedBefore?: string;
  finishedAfter?: string;
  tenantIdIn?: string[];
  withoutTenantId?: boolean;
  variables?: VariableFilter[];
  variableNamesIgnoreCase?: boolean;
  variableValuesIgnoreCase?: boolean;
  executedActivityBefore?: string;
  executedActivityAfter?: string;
  executedActivityIdIn?: string[];
  activeActivityIdIn?: string[];
  executedJobBefore?: string;
  executedJobAfter?: string;
  active?: boolean;
  suspended?: boolean;
  completed?: boolean;
  externallyTerminated?: boolean;
  internallyTerminated?: boolean;
  orQueries?: string[];
  sorting?: ProcessInstanceSortParams[];
}

export interface ProcessInstanceTerminateRequest {
  deleteReason?: string;
  processInstanceIds?: string[];
  skipCustomListeners: boolean;
  skipIoMappings: boolean;
  skipSubprocesses: boolean;
  failIfNotExists: boolean;
}

export interface ProcessInstanceBulkTerminateRequest {
  deleteReason: string;
  processInstanceIds?: string[];
  skipCustomListeners: boolean;
  skipSubprocesses: boolean;
  skipIoMappings: boolean;
}
