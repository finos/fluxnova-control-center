import { DateTimeOperators, SortOrderValues } from '../../common';

export enum JobSortByFields {
  jobId = 'jobId',
  executionId = 'executionId',
  processInstanceId = 'processInstanceId',
  processDefinitionId = 'processDefinitionId',
  processDefinitionKey = 'processDefinitionKey',
  jobPriority = 'jobPriority',
  jobRetries = 'jobRetries',
  jobDueDate = 'jobDueDate',
  tenantId = 'tenantId',
}

export class JobSortParams {
  sortBy?: JobSortByFields;
  sortOrder?: SortOrderValues;
}

export class JobDueDatesParams {
  operator?: DateTimeOperators;
  value?: string;
}

export class JobCreateTimesParams {
  operator?: DateTimeOperators;
  value?: string;
}

export class JobFilter {
  jobId?: string;
  jobIds?: string[];
  firstResult?: number;
  maxResults?: number;
  jobDefinitionId?: string;
  processInstanceId?: string;
  processInstanceIds?: string[];
  executionId?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  activityId?: string;
  withRetriesLeft?: boolean;
  executable?: boolean;
  timers?: boolean;
  messages?: boolean;
  dueDates?: JobDueDatesParams[];
  createTimes?: JobCreateTimesParams[];
  withException?: boolean;
  exceptionMessage?: string;
  failedActivityId?: string;
  noRetriesLeft?: boolean;
  active?: boolean;
  suspended?: boolean;
  priorityLowerThanOrEquals?: number;
  priorityHigherThanOrEquals?: number;
  tenantIdIn?: string[];
  withoutTenantId?: boolean;
  includeJobsWithoutTenantId?: boolean;
  sorting?: JobSortParams[];
}

export class JobDefinitionFilter {
  jobDefinitionId?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  activityIdIn?: string[];
  jobType?: string;
  jobConfiguration?: string;
  overridingJobPriority?: boolean;
  active?: boolean;
  suspended?: boolean;
  sortBy?: JobSortByFields;
  sortOrder?: SortOrderValues;
  firstResult?: number;
  maxResults?: number;
}

export class BulkJobRetriesRequest {
  jobIds?: string[];
  dueDate?: string;
  retries?: number;
}
