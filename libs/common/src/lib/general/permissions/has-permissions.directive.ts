import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import {
  ActionPermissionsSpec,
  EngineResourceType,
  ItemType,
  ItemTypeAction,
  ItemTypeActions,
  PermissionSpecification,
} from '@fxn/types';
import { PermissionService } from '../../services/permission.service';
import { supplementWithResourceIds } from '../../auth/access-permissions/action-access';

export interface HasPermissionsActionItemSpecification {
  action: keyof typeof ItemTypeActions;
  resources?: {
    itemType?: ItemType;
    itemId?: string;
  }[];
}

@Directive({
  selector: '[fluxnovaHasPermissions]',
  standalone: false,
})
export class HasPermissionsDirective implements OnInit {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  @Input('fluxnovaHasPermissions') requiredPermissions:
    | string
    | ItemTypeAction
    | PermissionSpecification
    | HasPermissionsActionItemSpecification = {};

  async ngOnInit() {
    let permissionsToCheck: PermissionSpecification;

    if (typeof this.requiredPermissions === 'string') {
      permissionsToCheck = ActionPermissionsSpec[this.requiredPermissions as ItemTypeAction];

      if (!permissionsToCheck) {
        this.onFailure('HasPermissionsDirective received invalid permission action string:', this.requiredPermissions);
        return;
      }
    } else if (this.requiredPermissions && 'action' in this.requiredPermissions) {
      // It's a HasPermissionsActionItemSpecification - supplement the ActionPermissions with resource IDs
      const permissionSpec = ActionPermissionsSpec[this.requiredPermissions.action];
      if (permissionSpec === undefined) {
        this.onFailure('HasPermissionsDirective unable to determine permission spec.', this.requiredPermissions);
        return;
      }

      permissionsToCheck = supplementWithResourceIds(
        permissionSpec,
        this.convertResourceIds(this.requiredPermissions?.resources),
      );
    } else {
      permissionsToCheck = this.requiredPermissions;
    }

    if (await this.permissionService.meetsPermissionSpecification(permissionsToCheck)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  private convertResourceIds(resources?: HasPermissionsActionItemSpecification['resources']): {
    [key: string]: string;
  } {
    if (!resources) {
      return {};
    }

    const resourceIds: { [key: string]: string } = {};
    resources.forEach((res) => {
      if (res.itemType && res.itemId) {
        const resourceType = EngineResourceType[res.itemType];
        if (resourceType !== undefined) {
          resourceIds[resourceType] = res.itemId;
        }
      }
    });
    return resourceIds;
  }

  private onFailure(msg: string, arg: any) {
    console.error(msg, {
      arg,
    });
    this.viewContainer.clear();
  }
}
