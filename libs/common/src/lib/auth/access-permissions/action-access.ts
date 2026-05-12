import {
  ActionPermissionsSpec,
  ButtonActions,
  EngineResourceType,
  ItemType,
  PermissionCheckResourceIds,
  PermissionSpecification,
} from '@fxn/types';

export function supplementWithResourceIds(
  permissionSpec: PermissionSpecification,
  resourceIds?: PermissionCheckResourceIds,
): PermissionSpecification {
  if (!resourceIds) {
    return permissionSpec;
  }

  const supplementedSpec: PermissionSpecification = {};
  let resourceId: string;

  for (const whichOf of ['AllOf' as keyof PermissionSpecification, 'OneOf' as keyof PermissionSpecification]) {
    if (permissionSpec[whichOf]) {
      supplementedSpec[whichOf] = permissionSpec[whichOf].map((perm) => {
        if ('resourceName' in perm) {
          // this is a ResourcePermissionPair - supplement & return
          resourceId = resourceIds[perm.resourceType];
          if (resourceId) {
            return { ...perm, resourceId };
          }
          return perm;
        } else {
          // recursively supplement nested PermissionSpecification
          return supplementWithResourceIds(perm, resourceIds);
        }
      });
    }
  }

  return supplementedSpec;
}

/**
 *
 * @param itemType
 * @param buttonAction
 * @param resourceIds Resource ID(s) to use in performing permission checks. Accepts a string or an object of EngineResourceType -> ID values. If a string is passed, the corresponding type is assumed to be the one associated with the value of the `itemType` parameter.
 */
export function getRequiredActionPermissions(
  itemType: ItemType,
  buttonAction: ButtonActions,
  resourceIds?: string | PermissionCheckResourceIds,
): PermissionSpecification {
  const resourceType = EngineResourceType[itemType];
  const ids = typeof resourceIds === 'string' ? { [resourceType]: resourceIds } : resourceIds;

  switch (itemType) {
    case ItemType.ProcessDefinition:
      switch (buttonAction) {
        case ButtonActions.ACTIVATE:
          return supplementWithResourceIds(ActionPermissionsSpec.ActivateProcessDefinition, ids);
        case ButtonActions.SUSPEND:
          return supplementWithResourceIds(ActionPermissionsSpec.SuspendProcessDefinition, ids);
        case ButtonActions.DELETE:
          return supplementWithResourceIds(ActionPermissionsSpec.DeleteProcessDefinition, ids);
        case ButtonActions.DOWNLOAD_RESOURCE:
          return supplementWithResourceIds(ActionPermissionsSpec.DownloadResource, ids);
        default:
          return {};
      }
    case ItemType.ProcessInstance:
      switch (buttonAction) {
        case ButtonActions.ACTIVATE:
          return supplementWithResourceIds(ActionPermissionsSpec.ActivateProcessInstance, ids);
        case ButtonActions.SUSPEND:
          return supplementWithResourceIds(ActionPermissionsSpec.SuspendProcessInstance, ids);
        case ButtonActions.TERMINATE:
          return supplementWithResourceIds(ActionPermissionsSpec.TerminateProcessInstance, ids);
        case ButtonActions.DOWNLOAD_RESOURCE:
          return supplementWithResourceIds(ActionPermissionsSpec.DownloadResource, ids);
        default:
          return {};
      }
    case ItemType.Batch:
      switch (buttonAction) {
        case ButtonActions.ACTIVATE:
          return supplementWithResourceIds(ActionPermissionsSpec.ActivateBatch, ids);
        case ButtonActions.SUSPEND:
          return supplementWithResourceIds(ActionPermissionsSpec.SuspendBatch, ids);
        case ButtonActions.RETRY:
          return supplementWithResourceIds(ActionPermissionsSpec.SetJobRetryCount, ids);
        case ButtonActions.DELETE:
          return supplementWithResourceIds(ActionPermissionsSpec.DeleteBatch, ids);
        default:
          return {};
      }
    case ItemType.Deployment:
      switch (buttonAction) {
        case ButtonActions.DELETE:
          return supplementWithResourceIds(ActionPermissionsSpec.DeleteDeployment, ids);
        case ButtonActions.DOWNLOAD_RESOURCE:
          return supplementWithResourceIds(ActionPermissionsSpec.DownloadResource, ids);
        default:
          return {};
      }
    default:
      return {};
  }
}
