import { OfProcessExecution } from '../common';
import { VariableValueInfo } from './variable';

/**
 * Type classes for responses from the history/* apis.
 */

export class BaseHistory extends OfProcessExecution {
  id = '';
  processDefinitionKey?: string;
  rootProcessInstanceId?: string;
}

export class CaseHistory extends BaseHistory {
  caseDefinitionId?: string;
  caseInstanceId?: string;
  caseExecutionId?: string;
  taskId?: string;
}

export class UserOperationHistory extends CaseHistory {
  userId?: string;
  timestamp?: string;
  operationId?: string;
  operationType?: string;
  property?: string;
  orgValue?: string;
  newValue?: string;
  deploymentId?: string;
  jobId?: string;
  jobDefinitionId?: string;
  entityType?: string;
  category?: string;
  annotation?: string;
}

export class DetailHistory extends CaseHistory {
  time?: string;
  type?: string;
  userOperationId?: string;
  variableName?: string;
  value?: string;
  valueInfo?: VariableValueInfo;
  activityInstanceId?: string;
  tenantId?: string;
  caseDefinitionKey?: string;
  variableInstanceId?: string;
  variableType?: string;
}

export interface ProcessInstanceHistoryTabItem {
  id?: string;
  type?: string;
  executionId?: string;
  activityId?: string;
  entityType?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  operationType?: string;
  data?: string;
  dataLabel?: string;
  details?: string;
  taskId?: string;
  userId?: string;
  userOperationId?: string;
  variableName?: string;
}
