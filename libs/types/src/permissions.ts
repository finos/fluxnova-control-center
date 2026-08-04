import { ItemType } from './entity-types';
import { ItemTypeAction } from './button-actions';

export interface ResourcePermissionPair {
  resourceName: ItemType;
  resourceType: number;
  resourceId?: string;
  permissionName: PermissionName;
}

export interface PermissionSpecification {
  OneOf?: (ResourcePermissionPair | PermissionSpecification)[];
  AllOf?: (ResourcePermissionPair | PermissionSpecification)[];
}

export interface PermissionCheckResourceIds {
  [engineResourceType: number]: string; // key should correspond with a valid `EngineResourceType` value
}

/**
 * Defines the set of possible resource types that permissions can be granted on.
 *
 * @see {@link https://docs.fluxnova.finos.org/reference/rest/specification/process-engine/authorization-service/#authorizations}
 */
export const EngineResourceType: Record<string, number> = {
  [ItemType.ProcessInstance]: 8,
  [ItemType.ProcessDefinition]: 6,
  [ItemType.Deployment]: 9,
  [ItemType.Batch]: 13,
  [ItemType.DecisionDefinition]: 10,
};

/**
 * Defines the set of possible permissions that can be granted on Fluxnova resources.
 *
 * @see {@link https://docs.fluxnova.finos.org/reference/rest/specification/process-engine/authorization-service/#authorizations}
 */
export type PermissionName =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACCESS'
  | 'SUSPEND'
  | 'CREATE_INSTANCE'
  | 'UPDATE_INSTANCE'
  | 'MIGRATE_INSTANCE'
  | 'SUSPEND_INSTANCE'
  | 'DELETE_INSTANCE'
  | 'RETRY_JOB'
  | 'UPDATE_VARIABLE'
  | 'UPDATE_INSTANCE_VARIABLE'
  | 'CREATE_BATCH_MIGRATE_PROCESS_INSTANCES'
  | 'ALL';

/**********************
 *  Perm Definitions  *
 *********************/
export const UpdateProcessInstancePermission: ResourcePermissionPair = {
  resourceName: ItemType.ProcessInstance,
  resourceType: EngineResourceType.ProcessInstance,
  permissionName: 'UPDATE',
};

export const UpdateProcessDefinitionPermission: ResourcePermissionPair = {
  resourceName: ItemType.ProcessDefinition,
  resourceType: EngineResourceType.ProcessDefinition,
  permissionName: 'UPDATE',
};

export const SuspendProcessDefinitionPermission: ResourcePermissionPair = {
  ...UpdateProcessDefinitionPermission,
  permissionName: 'SUSPEND',
};

export const UpdateInstanceProcessDefinitionPermission: ResourcePermissionPair = {
  ...UpdateProcessDefinitionPermission,
  permissionName: 'UPDATE_INSTANCE',
};

export const UpdateBatchPermission: ResourcePermissionPair = {
  resourceName: ItemType.Batch,
  resourceType: EngineResourceType.Batch,
  permissionName: 'UPDATE',
};

export const DeleteBatchPermission: ResourcePermissionPair = {
  ...UpdateBatchPermission,
  permissionName: 'DELETE',
};

export const UpdateInstancePermissions: ResourcePermissionPair[] = [
  UpdateProcessInstancePermission,
  UpdateInstanceProcessDefinitionPermission,
];

export const ActivateSuspendProcessInstancePermissions: ResourcePermissionPair[] = [
  ...UpdateInstancePermissions,
  {
    ...UpdateProcessInstancePermission,
    permissionName: 'SUSPEND',
  },
  {
    resourceName: ItemType.ProcessDefinition,
    resourceType: EngineResourceType.ProcessDefinition,
    permissionName: 'SUSPEND_INSTANCE',
  },
];

export const MandatoryPermissionsForMigrateProcessInstance: ResourcePermissionPair[] = [
  {
    ...UpdateProcessDefinitionPermission,
    permissionName: 'READ',
  },
  {
    ...SuspendProcessDefinitionPermission,
    permissionName: 'MIGRATE_INSTANCE',
  },
];

export const EitherOrPermissionsForMigrateProcessInstance: ResourcePermissionPair[] = [
  {
    ...UpdateBatchPermission,
    permissionName: 'CREATE',
  },
  {
    ...UpdateBatchPermission,
    permissionName: 'CREATE_BATCH_MIGRATE_PROCESS_INSTANCES',
  },
];

export const TerminateProcessInstancePermissions: ResourcePermissionPair[] = [
  {
    ...UpdateProcessInstancePermission,
    permissionName: 'DELETE',
  },
  {
    ...UpdateProcessDefinitionPermission,
    permissionName: 'DELETE_INSTANCE',
  },
];

/**********************
 *      SPEC          *
 *********************/
export const ActionPermissionsSpec: { [key in ItemTypeAction]: PermissionSpecification } = {
  ActivateProcessDefinition: {
    OneOf: [SuspendProcessDefinitionPermission, UpdateProcessDefinitionPermission],
  },
  SuspendProcessDefinition: {
    OneOf: [SuspendProcessDefinitionPermission, UpdateProcessDefinitionPermission],
  },
  DeleteProcessDefinition: {
    AllOf: [
      {
        ...UpdateProcessDefinitionPermission,
        permissionName: 'DELETE',
      },
    ],
  },
  DownloadResource: {
    AllOf: [
      {
        ...UpdateProcessDefinitionPermission,
        permissionName: 'READ',
      },
    ],
  },
  StartProcessDefinition: {
    AllOf: [
      {
        ...UpdateProcessDefinitionPermission,
        permissionName: 'CREATE_INSTANCE',
      },
      {
        ...UpdateProcessInstancePermission,
        permissionName: 'CREATE',
      },
    ],
  },
  MigrateProcessInstance: {
    AllOf: [
      ...MandatoryPermissionsForMigrateProcessInstance,
      {
        OneOf: EitherOrPermissionsForMigrateProcessInstance,
      },
    ],
  },
  SetJobRetryCount: {
    OneOf: [
      ...UpdateInstancePermissions,
      {
        ...UpdateProcessInstancePermission,
        permissionName: 'RETRY_JOB',
      },
      {
        ...UpdateProcessDefinitionPermission,
        permissionName: 'RETRY_JOB',
      },
    ],
  },
  ActivateJobDefinition: {
    AllOf: [UpdateProcessDefinitionPermission],
  },
  SuspendJobDefinition: {
    AllOf: [UpdateProcessDefinitionPermission],
  },
  ChangeJobDefinitionPriority: {
    AllOf: [UpdateProcessDefinitionPermission],
  },
  ActivateProcessInstance: {
    OneOf: ActivateSuspendProcessInstancePermissions,
  },
  SuspendProcessInstance: {
    OneOf: ActivateSuspendProcessInstancePermissions,
  },
  TerminateProcessInstance: {
    OneOf: TerminateProcessInstancePermissions,
  },
  MoveTokens: {
    OneOf: UpdateInstancePermissions,
  },
  ActivateJob: {
    OneOf: UpdateInstancePermissions,
  },
  SuspendJob: {
    OneOf: UpdateInstancePermissions,
  },
  ChangeJobDueDate: {
    OneOf: UpdateInstancePermissions,
  },
  DeleteJob: {
    OneOf: UpdateInstancePermissions,
  },
  ModifyProcessInstanceVariables: {
    OneOf: [
      ...UpdateInstancePermissions,
      {
        ...UpdateProcessInstancePermission,
        permissionName: 'UPDATE_VARIABLE',
      },
      {
        ...UpdateInstanceProcessDefinitionPermission,
        permissionName: 'UPDATE_INSTANCE_VARIABLE',
      },
    ],
  },
  ActivateBatch: {
    AllOf: [UpdateBatchPermission],
  },
  SuspendBatch: {
    AllOf: [UpdateBatchPermission],
  },
  DeleteBatch: {
    AllOf: [DeleteBatchPermission],
  },
  DeleteDeployment: {
    AllOf: [
      {
        resourceName: ItemType.Deployment,
        resourceType: EngineResourceType.Deployment,
        permissionName: 'DELETE',
      },
    ],
  },
  EvaluateDecisionDefinition: {
    AllOf: [
      {
        resourceName: ItemType.DecisionDefinition,
        resourceType: EngineResourceType.DecisionDefinition,
        permissionName: 'CREATE_INSTANCE',
      },
    ],
  },
} satisfies Record<ItemTypeAction, PermissionSpecification>;
