import { describe, expect, it } from 'vitest';
import { ButtonActions } from '@fxn/types';
import { ActionPermissionsSpec, EngineResourceType, ItemType, PermissionSpecification } from '@fxn/types';
import { getRequiredActionPermissions, supplementWithResourceIds } from './action-access';

describe('action-access', () => {
  describe('getRequiredPermissions', () => {
    it.each([
      { action: ButtonActions.ACTIVATE, permissions: ActionPermissionsSpec.ActivateProcessDefinition },
      { action: ButtonActions.SUSPEND, permissions: ActionPermissionsSpec.SuspendProcessDefinition },
      { action: ButtonActions.DELETE, permissions: ActionPermissionsSpec.DeleteProcessDefinition },
      { action: ButtonActions.DOWNLOAD_RESOURCE, permissions: ActionPermissionsSpec.DownloadResource },
    ])(
      'gets the predefined permissions for item type "ProcessDefinition" and action "$action"',
      ({ action, permissions }) => {
        const requiredPermissions = getRequiredActionPermissions(ItemType.ProcessDefinition, action);

        expect(requiredPermissions).toBe(permissions);
      },
    );

    it.each([
      { action: ButtonActions.ACTIVATE, permissions: ActionPermissionsSpec.ActivateProcessInstance },
      { action: ButtonActions.SUSPEND, permissions: ActionPermissionsSpec.SuspendProcessInstance },
      { action: ButtonActions.TERMINATE, permissions: ActionPermissionsSpec.TerminateProcessInstance },
      { action: ButtonActions.DOWNLOAD_RESOURCE, permissions: ActionPermissionsSpec.DownloadResource },
    ])(
      'gets the predefined permissions for item type "ProcessInstance" and action "$action"',
      ({ action, permissions }) => {
        const requiredPermissions = getRequiredActionPermissions(ItemType.ProcessInstance, action);

        expect(requiredPermissions).toBe(permissions);
      },
    );

    it.each([
      { action: ButtonActions.ACTIVATE, permissions: ActionPermissionsSpec.ActivateBatch },
      { action: ButtonActions.SUSPEND, permissions: ActionPermissionsSpec.SuspendBatch },
      { action: ButtonActions.RETRY, permissions: ActionPermissionsSpec.SetJobRetryCount },
      { action: ButtonActions.DELETE, permissions: ActionPermissionsSpec.DeleteBatch },
    ])('gets the predefined permissions for item type "Batch" and action "$action"', ({ action, permissions }) => {
      const requiredPermissions = getRequiredActionPermissions(ItemType.Batch, action);

      expect(requiredPermissions).toBe(permissions);
    });

    it.each([
      { action: ButtonActions.DELETE, permissions: ActionPermissionsSpec.DeleteDeployment },
      { action: ButtonActions.DOWNLOAD_RESOURCE, permissions: ActionPermissionsSpec.DownloadResource },
    ])('gets the predefined permissions for item type "Deployment" and action "$action"', ({ action, permissions }) => {
      const requiredPermissions = getRequiredActionPermissions(ItemType.Deployment, action);

      expect(requiredPermissions).toBe(permissions);
    });
  });

  describe('supplementWithResourceId', () => {
    const baseSpec: PermissionSpecification = {
      AllOf: [
        {
          resourceName: ItemType.ProcessDefinition,
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'READ',
        },
      ],
    };

    it('supplements with resourceId when object is provided', () => {
      const resourceIds = { [EngineResourceType.ProcessDefinition]: 'xyz789' };
      const result = supplementWithResourceIds(baseSpec, resourceIds);
      const actual =
        result.AllOf && result.AllOf[0] && 'resourceId' in result.AllOf[0]
          ? (result.AllOf[0] as any).resourceId
          : undefined;
      expect(actual).toBe('xyz789');
    });

    it('returns original spec if no resourceId is provided', () => {
      const result = supplementWithResourceIds(baseSpec);
      const actual =
        result.AllOf && result.AllOf[0] && 'resourceId' in result.AllOf[0]
          ? (result.AllOf[0] as any).resourceId
          : undefined;
      expect(actual).toBeUndefined();
    });

    it('supplements nested permission specs (OneOf inside AllOf)', () => {
      const nestedSpec: PermissionSpecification = {
        AllOf: [
          {
            OneOf: [
              {
                resourceName: ItemType.ProcessDefinition,
                resourceType: EngineResourceType.ProcessDefinition,
                permissionName: 'READ',
              },
              {
                resourceName: ItemType.ProcessInstance,
                resourceType: EngineResourceType.ProcessInstance,
                permissionName: 'UPDATE',
              },
            ],
          },
        ],
      };
      const resourceIds = {
        [EngineResourceType.ProcessDefinition]: 'id1',
        [EngineResourceType.ProcessInstance]: 'id2',
      };

      const result = supplementWithResourceIds(nestedSpec, resourceIds);
      const oneOf = result.AllOf && result.AllOf[0] && 'OneOf' in result.AllOf[0] ? (result.AllOf[0] as any).OneOf : [];
      expect(oneOf[0].resourceId).toBe('id1');
      expect(oneOf[1].resourceId).toBe('id2');
    });

    it('does not supplement when resourceType is not present in resourceIds', () => {
      const spec: PermissionSpecification = {
        AllOf: [
          {
            resourceName: ItemType.ProcessDefinition,
            resourceType: EngineResourceType.ProcessDefinition,
            permissionName: 'READ',
          },
        ],
      };
      const resourceIds = { 2: 'not-used' };
      const result = supplementWithResourceIds(spec, resourceIds);
      const actual =
        result.AllOf && result.AllOf[0] && 'resourceId' in result.AllOf[0]
          ? (result.AllOf[0] as any).resourceId
          : undefined;
      expect(actual).toBeUndefined();
    });

    it('supplements multiple permission pairs in the same spec', () => {
      const spec: PermissionSpecification = {
        AllOf: [
          {
            resourceName: ItemType.ProcessDefinition,
            resourceType: EngineResourceType.ProcessDefinition,
            permissionName: 'READ',
          },
          {
            resourceName: ItemType.ProcessInstance,
            resourceType: EngineResourceType.ProcessInstance,
            permissionName: 'UPDATE',
          },
        ],
      };
      const resourceIds = {
        [EngineResourceType.ProcessDefinition]: 'id1',
        [EngineResourceType.ProcessInstance]: 'id2',
      };
      const result = supplementWithResourceIds(spec, resourceIds);
      expect(result.AllOf && (result.AllOf[0] as any).resourceId).toBe('id1');
      expect(result.AllOf && (result.AllOf[1] as any).resourceId).toBe('id2');
    });
  });

  describe('getRequiredActionPermissions edge cases', () => {
    it('returns empty object for unknown itemType', () => {
      // @ts-expect-error Testing invalid itemType
      const result = getRequiredActionPermissions(-999 as ItemType, ButtonActions.ACTIVATE);
      expect(result).toEqual({});
    });

    it('returns empty object for unknown buttonAction', () => {
      const result = getRequiredActionPermissions(ItemType.ProcessDefinition, 'UNKNOWN_ACTION' as ButtonActions);
      expect(result).toEqual({});
    });

    it('supplements permission spec with resourceId for valid action', () => {
      const resourceId = 'pd-123';
      const result = getRequiredActionPermissions(ItemType.ProcessDefinition, ButtonActions.ACTIVATE, resourceId);
      expect(
        result.OneOf && result.OneOf[0] && 'resourceId' in result.OneOf[0] ? result.OneOf[0].resourceId : undefined,
      ).toBe(resourceId);
    });
  });
});
