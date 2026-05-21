export interface BatchResponse {
  id: string;
}

export interface BatchParams {
  [key: string]: any;
  batchId?: string;
  maxResults?: number;
  firstResult?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface BatchHistory {
  id?: string;
  totalJobs?: number;
  batchJobsPerSeed?: number;
  invocationsPerBatchJob?: number;
  seedJobDefinitionId?: string;
  monitorJobDefinitionId?: string;
  batchJobDefinitionId?: string;
  tenantId?: string;
  createUserId?: string;
  startTime?: string;
  removalTime?: string;
  executionStartTime?: string;
  endTime?: string;
  type?: string;
}

export interface BatchStatistic {
  id?: string;
  type?: string;
  totalJobs?: number;
  batchJobsPerSeed?: number;
  jobsCreated?: number;
  startTime?: string;
  executionStartTime?: string;
  invocationsPerBatchJob?: number;
  seedJobDefinitionId?: string;
  monitorJobDefinitionId?: string;
  batchJobDefinitionId?: string;
  remainingJobs?: number;
  completedJobs?: number;
  failedJobs?: number;
  suspended?: boolean;
  tenantId?: string;
  createUserId?: string;
}

export interface Batch extends BatchHistory, BatchStatistic {}
