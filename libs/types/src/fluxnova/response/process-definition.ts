import { ItemList } from '../../common';
import { DetailHistory, UserOperationHistory } from './history';
import { ActivityInstanceHistory } from './activity-instance';
import { Incident } from './incident';

export interface ProcessDefinition {
  id: string;
  key?: string;
  category?: string;
  description?: string;
  name?: string;
  version?: number;
  resource?: string;
  deploymentId?: string;
  diagram?: string; // not displayed
  suspended?: boolean;
  tenantId?: string; // not displayed
  versionTag?: string;
  historyTimeToLive?: number;
  startableInTasklist?: boolean; // not displayed
}

export class ProcessDefinitionList implements ItemList<ProcessDefinition> {
  totalCount?: number;
  items?: ProcessDefinition[];
}

export interface ProcessDefinitionDiagram {
  name: string;
  definitionId: string;
  xml: string;
  subs?: ProcessDefinitionSub[];
}

export interface ProcessDefinitionSub {
  name?: string;
  processDefinitionId?: string;
}

export interface ProcessDefinitionHistory {
  userOperation: UserOperationHistory[];
  activityInstance: ActivityInstanceHistory[];
  incident: Incident[];
}

export interface ProcessDefinitionFullHistory extends ProcessDefinitionHistory {
  detail: DetailHistory[];
}

export interface ProcessDefinitionIncidentStatistic {
  incidentType: string;
  incidentCount: number;
}

export interface ProcessDefinitionStatistic {
  id: string;
  instances: number;
  failedJobs?: number;
  incidents: ProcessDefinitionIncidentStatistic[];
}

export interface StaticCalledProcessDefinition {
  id: string;
  name: string;
  calledFromActivityIds: string[];
}

export interface CalledProcessDefinition extends StaticCalledProcessDefinition {
  state: string;
  calledFromActivityId: string;
}
