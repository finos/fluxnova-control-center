import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WINDOW } from 'ngx-window-token';
import { EngineResourceType, ItemType } from '@fxn/types';
import { ResourcePermissionPair } from '@fxn/types/src/permissions';
import { mockUserService } from '@fxn/test-support';
import { AuthorizationHttpService } from '../auth/authorization.http-service';
import { PermissionService, PermissionSpecification } from './permission.service';
import { UserService } from './user.service';

describe('PermissionService', () => {
  let service: PermissionService;
  const mockWindow: Window = {
    fluxnovaConfig: {
      authRequired: true,
    },
  } as unknown as Window;

  const mockAuthHttpService = {
    checkSync: vi.fn().mockResolvedValue(false),
  };

  /**
   * Sets up the mock for AuthorizationHttpService.checkSync to return true for the provided expected permissions.
   * @param expectedPermissions
   */
  const setupMockAuthCheckPermissions = (expectedPermissions: ResourcePermissionPair[]) => {
    mockAuthHttpService.checkSync.mockImplementation((permission: ResourcePermissionPair) =>
      expectedPermissions.some((expectedPermission) => {
        if (
          expectedPermission.permissionName !== permission.permissionName ||
          expectedPermission.resourceName !== permission.resourceName ||
          expectedPermission.resourceType !== permission.resourceType
        ) {
          return false;
        }

        return !(
          permission.resourceId &&
          expectedPermission.resourceId &&
          expectedPermission.resourceId !== permission.resourceId
        );
      }),
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: AuthorizationHttpService, useValue: mockAuthHttpService },
        { provide: UserService, useValue: mockUserService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    });

    service = TestBed.inject(PermissionService);
    mockWindow.fluxnovaConfig.authRequired = true;

    mockAuthHttpService.checkSync.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should return true without calling the authorization/check api when authRequired is false', async () => {
    mockWindow.fluxnovaConfig.authRequired = false;

    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'CREATE',
        },
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'CREATE_INSTANCE',
        },
      ],
    };

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(true);
    expect(mockAuthHttpService.checkSync).not.toHaveBeenCalled();
  });

  it('should return true if specification requires several permissions and user has all of them', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'CREATE',
        },
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'CREATE_INSTANCE',
        },
      ],
    };

    setupMockAuthCheckPermissions(requiredPermissions.AllOf as ResourcePermissionPair[]);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(true);
  });

  it('should return true if specification requires one of several permissions and user has one of them', async () => {
    const requiredPermissions: PermissionSpecification = {
      OneOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'UPDATE',
        },
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'UPDATE_INSTANCE',
        },
      ],
    };

    setupMockAuthCheckPermissions([requiredPermissions.OneOf?.[0] as ResourcePermissionPair]);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(true);
  });

  it('should return false if specification requires several permissions and user has only some of them', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'CREATE',
        },
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'CREATE_INSTANCE',
        },
      ],
    };

    setupMockAuthCheckPermissions([requiredPermissions.AllOf?.[0] as ResourcePermissionPair]);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(false);
  });

  it('should return false if specification requires one of several permissions and user has none of them', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'CREATE',
        },
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'CREATE_INSTANCE',
        },
      ],
    };

    const actualPermissions = [
      {
        resourceName: 'ProcessDefinition',
        resourceType: EngineResourceType.ProcessDefinition,
        permissionName: 'UPDATE_INSTANCE',
      } as ResourcePermissionPair,
    ];

    setupMockAuthCheckPermissions(actualPermissions);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(false);
  });

  it('should return true if the specification requires a specific permission and user has "all"', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessInstance',
          resourceType: EngineResourceType.ProcessInstance,
          permissionName: 'UPDATE',
        },
      ],
    };

    const actualPermissions = [
      {
        resourceName: 'ProcessInstance',
        resourceType: EngineResourceType.ProcessInstance,
        permissionName: 'ALL',
      } as ResourcePermissionPair,
    ];

    setupMockAuthCheckPermissions(actualPermissions);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(true);
  });

  it('should return false if no requiredPermissions are provided', async () => {
    const requiredPermissions: PermissionSpecification = {};

    const actualPermissions = [
      {
        resourceName: 'ProcessInstance',
        resourceType: EngineResourceType.ProcessInstance,
        permissionName: 'CREATE',
      } as ResourcePermissionPair,
    ];

    setupMockAuthCheckPermissions(actualPermissions);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(false);
  });

  it('returns true when user meets nested permission specification', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'READ',
        },
        {
          OneOf: [
            {
              resourceName: 'ProcessInstance',
              resourceType: EngineResourceType.ProcessInstance,
              permissionName: 'UPDATE',
            },
            {
              resourceName: 'ProcessDefinition',
              resourceType: EngineResourceType.ProcessDefinition,
              permissionName: 'UPDATE_INSTANCE',
            },
          ],
          AllOf: [
            {
              resourceName: 'Deployment',
              resourceType: EngineResourceType.Deployment,
              permissionName: 'UPDATE',
            },
            { resourceName: 'Deployment', resourceType: EngineResourceType.Deployment, permissionName: 'READ' },
          ],
        },
      ],
    };

    const actualPermissions: ResourcePermissionPair[] = [
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
      { resourceName: ItemType.Deployment, resourceType: EngineResourceType.Deployment, permissionName: 'UPDATE' },
      { resourceName: ItemType.Deployment, resourceType: EngineResourceType.Deployment, permissionName: 'READ' },
    ];

    setupMockAuthCheckPermissions(actualPermissions);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(true);
  });

  it('returns false when user does not meet nested permission specification', async () => {
    const requiredPermissions: PermissionSpecification = {
      AllOf: [
        {
          resourceName: 'ProcessDefinition',
          resourceType: EngineResourceType.ProcessDefinition,
          permissionName: 'READ',
        },
        {
          OneOf: [
            {
              resourceName: 'ProcessInstance',
              resourceType: EngineResourceType.ProcessInstance,
              permissionName: 'UPDATE',
            },
            {
              resourceName: 'ProcessDefinition',
              resourceType: EngineResourceType.ProcessDefinition,
              permissionName: 'UPDATE_INSTANCE',
            },
          ],
          AllOf: [
            {
              resourceName: 'Deployment',
              resourceType: EngineResourceType.Deployment,
              permissionName: 'UPDATE',
            },
            { resourceName: 'Deployment', resourceType: EngineResourceType.Deployment, permissionName: 'READ' },
          ],
        },
      ],
    };

    const actualPermissions: ResourcePermissionPair[] = [
      {
        resourceName: ItemType.ProcessDefinition,
        resourceType: EngineResourceType.ProcessDefinition,
        permissionName: 'READ',
      },
      { resourceName: ItemType.Deployment, resourceType: EngineResourceType.Deployment, permissionName: 'UPDATE' },
      { resourceName: ItemType.Deployment, resourceType: EngineResourceType.Deployment, permissionName: 'READ' },
    ];

    setupMockAuthCheckPermissions(actualPermissions);

    await expect(service.meetsPermissionSpecification(requiredPermissions)).resolves.toBe(false);
  });
});
