import { FluxnovaNode } from '../common';
import { ItemList } from '../../common';

export class JobDefinition {
  id?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  activityId?: string;
  jobType?: string;
  jobConfiguration?: string;
  overridingJobPriority?: string;
  suspended?: boolean;
  tenantId?: string;
  deploymentId?: string;
}

export class JobList implements ItemList<Job> {
  totalCount?: number;
  items?: Job[];
}

export class Job {
  id?: string;
  activityId?: string;
  jobDefinitionId?: string;
  dueDate?: string;
  processInstanceId?: string;
  executionId?: string;
  processDefinitionId?: string;
  processDefinitionKey?: string;
  retries?: number;
  exceptionMessage?: string;
  failedActivityId?: string;
  suspended?: boolean;
  priority?: number;
  tenantId?: string;
  createTime?: string;
  jobDefinition?: JobDefinition;
  node?: FluxnovaNode;
  timestamp?: string;
}
