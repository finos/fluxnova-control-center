import { BaseHistory } from './history';

export interface ActivityInstance {
  id?: string;
  activityId?: string;
  activityName?: string;
  activityType?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  childActivityInstances?: ActivityInstance[];
  childTransitionInstances?: TransitionInstance[];
  executionIds?: string[];
  incidentIds?: string[];
  incidents?: { id: string; activityId: string }[];
  name?: string;
  parentActivityInstanceId?: string;
  calledProcessInstanceId?: string;
  startTime?: string;
  endTime?: string;
}

export interface TransitionInstance {
  id?: string;
  activityId?: string;
  activityName?: string;
  activityType?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  executionId?: string[];
  incidentIds?: string[];
  incidents?: { id: string; activityId: string }[];
}

export interface ActivityInstanceHistory extends BaseHistory {
  parentActivityInstanceId?: string;
  activityId: string;
  activityName?: string;
  activityType?: string;
  taskId?: string;
  assignee?: string;
  calledProcessInstanceId?: string;
  calledCaseInstanceId?: string;
  startTime?: string;
  endTime?: string;
  durationInMillis?: number;
  canceled?: boolean;
  completeScope?: boolean;
  tenantId?: string;
  removalTime?: string;
}

/**
 * Custom type specific for representing both current
 * and historical activity instance information.
 */

export interface CompleteActivityInstanceInfo {
  active: ActivityInstance;
  historical: ActivityInstanceHistory[];
}
