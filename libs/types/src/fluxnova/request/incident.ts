export interface IncidentsFilter {
  incidentId?: string;
  incidentType?: string;
  incidentMessage?: string;
  incidentMessageLike?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  processDefinitionKeyIn?: string[];
  processInstanceId?: string;
  executionId?: string;
  createTimeBefore?: string;
  createTimeAfter?: string;
  endTimeBefore?: string;
  endTimeAfter?: string;
  activityId?: string;
  failedActivityId?: string;
  causeIncidentId?: string;
  rootCauseIncidentId?: string;
  configuration?: string;
  tenantIdIn?: string[];
  withoutTenantId?: boolean;
  jobDefinitionIdIn?: string[];
  open?: boolean;
  deleted?: boolean;
  resolved?: boolean;
  sortBy?: string;
  sortOrder?: string;
}
