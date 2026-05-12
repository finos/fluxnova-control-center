export interface MigrationPlan {
  sourceProcessDefinitionId?: string;
  targetProcessDefinitionId?: string;
  updateEventTriggers?: boolean;
}

export interface MigrationExecutionRequest {
  migrationPlan: MigrationPlan;
  processInstanceIds?: string[];
  processInstanceQuery?: {
    processDefinitionId: string;
  };
  skipCustomListeners?: boolean;
  skipIoMappings?: boolean;
}
