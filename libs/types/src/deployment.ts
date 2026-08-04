export interface DeploymentResponse {
  id: string;
  name: string;
  source: string;
  deploymentTime: string;
  deployedProcessDefinitions?: DeployedProcessDefinition[];
}

export interface DeploymentResource {
  id: string;
  name: string;
  deploymentId: string;
  data?: string;
}

// for the metadata of the deployment resources
export interface DeploymentProcess {
  id: string;
  name?: string;
  key?: string;
  fileName?: string;
  version?: number;
  instanceCount?: number;
}

export interface DeployedProcessDefinition {
  id: string;
  key: string;
  category: string;
  description: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  diagram: string;
  suspended: boolean;
  versionTag: string;
  historyTimeToLive: number;
}

export const ALLOWED_EXTENSIONS = ['.bpmn', '.bpmn20.xml', '.dmn', '.xml', '.js', '.groovy', '.jpeg'];
export const ALLOWED_MIME_TYPES = [
  'application/xml',
  'text/xml',
  'application/octet-stream',
  'application/javascript',
  'text/x-groovy',
  'image/jpeg',
];
