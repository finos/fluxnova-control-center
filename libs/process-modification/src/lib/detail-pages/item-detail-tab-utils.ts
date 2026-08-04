export enum PimTab {
  CalledProcessDefinitions = 'called-process-definitions',
  CalledProcessInstances = 'called-process-instances',
  Definitions = 'definitions',
  History = 'history',
  Incidents = 'incidents',
  Inputs = 'inputs',
  Instances = 'instances',
  JobDefinitions = 'job-definitions',
  Jobs = 'jobs',
  DecisionInstances = 'decision-instances',
  Outputs = 'outputs',
  Variables = 'variables',
  FailedJobs = 'failed-jobs',
  JobLogs = 'job-logs',
  DecisionRequirementsDefinitions = 'decision-requirements-definitions',
  RemainingJobs = 'remaining-jobs',
  UserTasks = 'user-tasks',
}

/**
 * The query param that is added to the url
 * when a row in the tab grid is selected.
 */
export enum PimTabRowQueryParam {
  Jobs = 'jobId',
  JobDefinitions = 'jobDefinitionId',
  Incidents = 'incidentId',
  Instances = 'processInstanceId',
  DecisionInstances = 'decisionInstance',
  CalledProcessInstances = 'calledProcessInstanceId',
  CalledProcessDefinitions = 'calledProcessDefinitionId',
  History = 'historyId',
  Variables = 'variableId',
  UserTasks = 'userTaskId',
  Undefined = '',
}

export const ProcessInstanceTabs = [
  PimTab.Variables,
  PimTab.Incidents,
  PimTab.CalledProcessInstances,
  PimTab.Jobs,
  PimTab.History,
  PimTab.DecisionInstances,
  PimTab.UserTasks,
];
export const FinishedProcessInstanceTabs = [
  PimTab.Variables,
  PimTab.Incidents,
  PimTab.CalledProcessInstances,
  PimTab.History,
  PimTab.DecisionInstances,
];
export const ProcessDefinitionTabs = [
  PimTab.Instances,
  PimTab.Incidents,
  PimTab.JobDefinitions,
  PimTab.CalledProcessDefinitions,
  PimTab.DecisionInstances,
];
export const DecisionInstanceTabs = [PimTab.Inputs, PimTab.Outputs];
export const BatchTabs = [PimTab.JobLogs, PimTab.FailedJobs, PimTab.RemainingJobs];
export const DecisionDefinitionTabs = [PimTab.DecisionInstances];
export const DeploymentTabs = [PimTab.Definitions, PimTab.DecisionRequirementsDefinitions];
