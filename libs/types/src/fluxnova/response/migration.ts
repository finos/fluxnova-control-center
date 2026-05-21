export interface MigrationInstructions {
  sourceActivityIds?: string[];
  targetActivityIds?: string[];
  updateEventTrigger?: boolean;
}

export interface GeneratedMigrationPlan {
  sourceProcessDefinitionId?: string;
  targetProcessDefinitionId?: string;
  instructions?: MigrationInstructions[];
}

export interface GeneratedExecutionPlan {
  migrationPlan: GeneratedMigrationPlan;
  processInstanceIds?: string[];
  skipCustomListeners?: boolean;
  skipIoMappings?: boolean;
}
