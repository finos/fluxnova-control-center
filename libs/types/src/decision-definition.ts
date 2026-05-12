export interface DecisionDefinitionResponse {
  id: string | null;
  key: string | null;
  category: string | null;
  name: string | null;
  version: number | null;
  resource: string | null;
  deploymentId: string | null;
  tenantId: string | null;
  decisionRequirementsDefinitionId: string | null;
  decisionRequirementsDefinitionKey: string | null;
  historyTimeToLive: number | null;
  versionTag: string | null;
}

export interface DecisionDefinitionResource {
  id: string;
  name: string;
  version: number;
  key: string;
  deploymentId: string;
}

export interface DecisionDefinitionDiagram {
  name: string;
  definitionId: string;
  xml: string;
}

export interface DecisionDefinition {
  id: string;
  key: string;
  category: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  tenantId: string | null;
  decisionRequirementsDefinitionId: string;
  decisionRequirementsDefinitionKey: string;
  historyTimeToLive: number;
  versionTag: string | null;
}

export interface DecisionRequirementsDefinition {
  id: string;
  key: string;
  category: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  tenantId: string | null;
}
