import { ItemList } from '../../common';
import { DetailHistory, UserOperationHistory } from './history';
import { ActivityInstanceHistory } from './activity-instance';
import { Incident } from './incident';

//Technically this is history/process-instance return type.
export interface ProcessInstance {
  id: string;
  rootProcessInstanceId?: string;
  superProcessInstanceId?: string;
  superCaseInstanceId?: string;
  caseInstanceId?: string;
  processDefinitionName?: string;
  processDefinitionKey?: string;
  processDefinitionVersion?: number;
  processDefinitionId?: string;
  businessKey?: string;
  startTime?: string;
  endTime?: string;
  removalTime?: string;
  durationInMillis?: number;
  startUserId?: string;
  startActivityId?: string;
  deleteReason?: string;
  tenantId?: string;
  state?: string;
  hasIncidents?: boolean;
  activityId?: string;
}

export class ProcessInstanceList implements ItemList<ProcessInstance> {
  totalCount?: number;
  items?: ProcessInstance[];
}

export interface ProcessInstanceHistory {
  userOperation: UserOperationHistory[];
  activityInstance: ActivityInstanceHistory[];
  incident: Incident[];
}

export interface ProcessInstanceFullHistory extends ProcessInstanceHistory {
  detail: DetailHistory[];
}

export interface ProcessInstanceStatistic {
  id?: string;
  parentActivityInstanceId?: string;
  activityId?: string;
  activityName?: string;
  activityType?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  childActivityInstances?: ProcessInstanceStatistic[];
  childTransitionInstances?: ProcessInstanceStatistic[];
  executionIds?: string[];
  incidentIds?: string[];
  incidents?: Incident[];
}
