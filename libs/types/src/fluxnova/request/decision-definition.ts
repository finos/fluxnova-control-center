export class DecisionDefinitionParams {
  after?: string;
  before?: string;
  decisionDefinitionId?: string;
  deploymentId?: string;
  firstResult?: number;
  id?: string;
  key?: string;
  keyLike?: string;
  latestVersion?: boolean;
  maxResults?: number;
  name?: string;
  nameLike?: string;
  resourceName?: string;
  sortBy?: string;
  sortOrder?: string;
  source?: string;
  version?: number;
}

export interface DecisionDefinitionEvaluateRequest {
  variables?: {
    [variableName: string]: {
      value: any;
      type?: string;
      valueInfo?: {
        objectTypeName?: string;
        serializationDataFormat?: string;
        filename?: string;
        mimetype?: string;
        encoding?: string;
      };
    };
  };
}
