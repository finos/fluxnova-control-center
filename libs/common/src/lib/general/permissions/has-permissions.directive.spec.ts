import {
  ActionPermissionsSpec,
  EngineResourceType,
  ItemType,
  ItemTypeActions,
  PermissionSpecification,
} from '@fxn/types';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionService } from '../../services/permission.service';
import * as actionAccess from '../../auth/access-permissions/action-access';
import { HasPermissionsDirective } from './has-permissions.directive';

describe('HasPermissionsDirective', () => {
  const mockTemplateRef = {};
  const mockViewContainerRef = {
    createEmbeddedView: vi.fn(),
    clear: vi.fn(),
  };
  const mockPermissionService = {
    meetsPermissionSpecification: vi.fn(),
  };
  let directive: HasPermissionsDirective;

  const requiredPermissions: PermissionSpecification = {
    AllOf: [
      {
        resourceName: ItemType.ProcessInstance,
        resourceType: EngineResourceType.ProcessInstance,
        permissionName: 'READ',
      },
      {
        resourceName: ItemType.ProcessInstance,
        resourceType: EngineResourceType.ProcessInstance,
        permissionName: 'UPDATE',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        HasPermissionsDirective,
        { provide: TemplateRef, useValue: mockTemplateRef },
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    });

    directive = TestBed.inject(HasPermissionsDirective);
  });

  it('allows using keyof ActionPermissions for the required permissions', async () => {
    directive.requiredPermissions = ItemTypeActions.ActivateProcessInstance;
    mockPermissionService.meetsPermissionSpecification.mockResolvedValue(true);

    await directive.ngOnInit();

    expect(mockPermissionService.meetsPermissionSpecification).toHaveBeenCalledWith(
      ActionPermissionsSpec.ActivateProcessInstance,
    );
  });

  it('should create embedded view if permissionService.meetsPermissionSpecification returns true', async () => {
    directive.requiredPermissions = requiredPermissions;
    mockPermissionService.meetsPermissionSpecification.mockResolvedValue(true);

    await directive.ngOnInit();

    expect(mockPermissionService.meetsPermissionSpecification).toHaveBeenCalledWith(requiredPermissions);
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
    expect(mockViewContainerRef.clear).not.toHaveBeenCalled();
  });

  it('should clear the view container if permissionService.meetsPermissionSpecification returns false', async () => {
    directive.requiredPermissions = requiredPermissions;
    mockPermissionService.meetsPermissionSpecification.mockResolvedValue(false);

    await directive.ngOnInit();

    expect(mockPermissionService.meetsPermissionSpecification).toHaveBeenCalledWith(requiredPermissions);
    expect(mockViewContainerRef.createEmbeddedView).not.toHaveBeenCalled();
    expect(mockViewContainerRef.clear).toHaveBeenCalled();
  });

  it('should handle HasPermissionsActionItemSpecification input and supplement with resource IDs', async () => {
    // Arrange: mock supplementWithResourceId and ActionPermissionsSpec
    const mockSupplement = vi.fn((spec, ids) => ({ ...spec, resourceIds: ids }));
    vi.spyOn(actionAccess, 'supplementWithResourceIds').mockImplementation(mockSupplement);

    const action = ItemTypeActions.ActivateProcessInstance;
    const resources = [
      { itemType: ItemType.ProcessInstance, itemId: 'abc123' },
      { itemType: ItemType.ProcessInstance, itemId: 'def456' },
      { itemType: ItemType.ProcessDefinition, itemId: 'efg567' },
    ];
    const input = { action, resources };
    const expectedSpec = ActionPermissionsSpec[action];
    const expectedResourceIds = {
      [EngineResourceType[ItemType.ProcessInstance]]: 'def456',
      [EngineResourceType[ItemType.ProcessDefinition]]: 'efg567',
    };
    // Only the last itemId for a type is kept in convertResourceIds
    const expectedSupplemented = { ...expectedSpec, resourceIds: expectedResourceIds };

    directive.requiredPermissions = input;
    mockPermissionService.meetsPermissionSpecification.mockResolvedValue(true);

    // Act
    await directive.ngOnInit();

    // Assert
    expect(mockSupplement).toHaveBeenCalledWith(expectedSpec, expectedResourceIds);
    expect(mockPermissionService.meetsPermissionSpecification).toHaveBeenCalledWith(expectedSupplemented);
    expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
  });
});
