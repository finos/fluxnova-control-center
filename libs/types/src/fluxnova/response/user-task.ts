import { FluxnovaVariableTypes } from './variable';

export interface UserTask {
  id: string;
  name: string | null;
  assignee: string | null;
  created: string;
  due?: string | null;
  followUp?: string | null;
  delegationState?: 'PENDING' | 'RESOLVED' | null;
  description?: string | null;
  executionId?: string | null;
  owner?: string | null;
  parentTaskId?: string | null;
  priority?: number;
  processDefinitionId?: string | null;
  processInstanceId?: string | null;
  caseDefinitionId?: string | null;
  caseInstanceId?: string | null;
  caseExecutionId?: string | null;
  taskDefinitionKey?: string | null;
  suspended?: boolean;
  formKey?: string | null;
  tenantId?: string | null;
  variables?: Record<string, FluxnovaVariableTypes> | null;
}
