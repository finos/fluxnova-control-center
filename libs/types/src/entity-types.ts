export enum ItemType {
  ProcessInstance = 'ProcessInstance',
  ProcessDefinition = 'ProcessDefinition',
  Deployment = 'Deployment',
  Job = 'Job',
  JobDefinition = 'JobDefinition',
  Incident = 'Incident',
  Batch = 'Batch',
  DecisionDefinition = 'DecisionDefinition',
  DecisionInstance = 'DecisionInstance',
}

export enum SubItemType {
  Active = 'active',
  Completed = 'completed',
}
