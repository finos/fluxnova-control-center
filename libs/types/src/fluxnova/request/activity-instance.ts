export interface ActivityInstanceHistoryFilter {
  activityInstanceId?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  executionId?: string;
  activityId?: string;
  activityName?: string;
  activityType?: string;
  taskAssignee?: string;
  finished?: boolean;
  unfinished?: boolean;
  canceled?: boolean;
  completeScope?: boolean;
  startedBefore?: string;
  startedAfter?: string;
  finishedBefore?: string;
  finishedAfter?: string;
  tenantIdIn?: string[];
  withoutTenantId?: string;
}
