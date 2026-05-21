export interface DecisionInstanceParams {
  decisionDefinitionId?: string;
  decisionDefinitionKeyIn?: string;
  decisionInstanceId?: string;
  decisionInstanceIdIn?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processInstanceId?: string;
  decisionDefinitionNameLike?: string;
  evaluatedBefore?: string;
  evaluatedAfter?: string;
  sortBy?: string;
  sortOrder?: string;
  firstResult?: number;
  maxResults?: number;
}
