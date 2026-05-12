export interface DecisionInstance {
  activityId?: string;
  activityInstanceId?: string;
  collectResultValue?: string;
  decisionDefinitionId?: string;
  decisionDefinitionKey?: string;
  decisionDefinitionName?: string;
  evaluationTime?: string;
  removalTime?: string;
  id?: string;
  inputs?: DecisionInstanceIO[];
  outputs?: DecisionInstanceIO[];
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processInstanceId?: string;
  rootProcessInstanceId?: string;
  caseDefinitionId?: string;
  caseDefinitionKey?: string;
  caseInstanceId?: string;
  tenantId?: string;
  userId?: string;
  rootDecisionInstanceId?: string;
  decisionRequirementsDefinitionId?: string;
  decisionRequirementsDefinitionKey?: string;
}

export interface DecisionInstanceIO {
  clauseId: string;
  clauseName: string;
  decisionInstanceId: string;
  errorMessage: string;
  id: string;
  type: string;
  createTime: string;
  removalTime: string;
  rootProcessInstanceId: string;
  value: any;
}

export interface DecisionInstanceDiagram {
  id: string;
  dmnXml: string;
}
