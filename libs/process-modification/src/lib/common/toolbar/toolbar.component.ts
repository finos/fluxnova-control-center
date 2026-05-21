import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ButtonActions, ItemType, ProcessInstanceStatesMap } from '@fxn/types';
import { PermissionService } from '@fxn/common/src/lib/services/permission.service';
import { getRequiredActionPermissions } from '@fxn/common/src/lib/auth/access-permissions/action-access';
import { DiagramToolbarComponent } from '../../detail-pages/diagram-section/diagram-toolbar/diagram-toolbar.component';
import { ToolbarButtonComponent } from './toolbar-button.component';
import { ToolbarService } from './toolbar.service';

export interface ToolbarEvent {
  target: string;
  action: string;
  value?: any;
}

@Component({
  selector: 'fluxnova-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  standalone: false,
})
export class ToolbarComponent {
  cdr = inject(ChangeDetectorRef);
  toolbarService = inject(ToolbarService);
  private permissionService = inject(PermissionService);

  @ViewChildren(ToolbarButtonComponent)
  public buttons?: QueryList<ToolbarButtonComponent>;

  @ViewChild(forwardRef(() => DiagramToolbarComponent))
  public diagramToolbar?: DiagramToolbarComponent;

  @Input()
  public hideDiagramToolbar = false;

  protected readonly ItemType = ItemType;

  private _itemType?: ItemType;
  private _itemId?: string;

  public set item(itemData: { type: ItemType; id?: string }) {
    this._itemType = itemData.type;
    this._itemId = itemData.id;

    void this.initButtons();
  }

  public get itemType(): ItemType | undefined {
    return this._itemType;
  }

  public get itemId(): string | undefined {
    return this._itemId;
  }

  public get dividerActive(): boolean {
    const buttons = this.buttons?.toArray();
    if (!buttons) {
      return false;
    }
    return this.toolbarService.leftButtonVisible(buttons) && this.toolbarService.rightButtonVisible(buttons);
  }

  public disable(btns: ButtonActions[]) {
    this.updateEnabled(btns, false);
  }

  public enable(btns: ButtonActions[]) {
    this.updateEnabled(btns);
  }

  public hide(btns: ButtonActions[]) {
    this.updateVisibility(btns);

    this.cdr.detectChanges();
  }

  public show(btns: ButtonActions[]) {
    this.updateVisibility(btns, false);

    this.cdr.detectChanges();
  }

  private async initButtons() {
    let buttonActions: ButtonActions[] = [];

    switch (this._itemType) {
      case ItemType.ProcessInstance:
        if (this.diagramToolbar) {
          this.diagramToolbar.diagramType = ItemType.ProcessInstance;
          this.diagramToolbar.itemId = this.itemId;
          this.cdr.detectChanges();
        }
        buttonActions = await this.filterPermittedButtonActions(
          this._itemType,
          [ButtonActions.SUSPEND, ButtonActions.TERMINATE, ButtonActions.DOWNLOAD_RESOURCE],
          this.itemId,
        );
        break;
      case ItemType.ProcessDefinition: {
        if (this.diagramToolbar) {
          this.diagramToolbar.diagramType = ItemType.ProcessDefinition;
          this.diagramToolbar.itemId = this.itemId;
          this.cdr.detectChanges();
        }
        buttonActions = await this.filterPermittedButtonActions(
          this._itemType,
          [ButtonActions.SUSPEND, ButtonActions.DELETE, ButtonActions.DOWNLOAD_RESOURCE],
          this.itemId,
        );
        break;
      }
      case ItemType.DecisionDefinition:
        if (this.diagramToolbar) {
          this.diagramToolbar.diagramType = ItemType.DecisionDefinition;
          this.diagramToolbar.itemId = this.itemId;
          this.cdr.detectChanges();
        }
        break;
      case ItemType.Batch:
        buttonActions = await this.filterPermittedButtonActions(
          this._itemType,
          [ButtonActions.SUSPEND, ButtonActions.RETRY, ButtonActions.DELETE],
          this.itemId,
        );
        break;
      case ItemType.Deployment:
        buttonActions = await this.filterPermittedButtonActions(
          this._itemType,
          [ButtonActions.DELETE, ButtonActions.DOWNLOAD_RESOURCE],
          this.itemId,
        );
        break;
      default:
        break;
    }

    this.show(buttonActions);
  }

  public async updateButtonStates(item: any) {
    switch (this._itemType) {
      case ItemType.Batch:
        if (item.endTime) {
          this.hide([ButtonActions.ACTIVATE]);
          this.disable([ButtonActions.ACTIVATE]);
          this.hide([ButtonActions.SUSPEND]);
          this.disable([ButtonActions.SUSPEND]);
          this.hide([ButtonActions.RETRY]);
          this.disable([ButtonActions.RETRY]);
          this.enable([ButtonActions.DELETE]);
        } else if (!item.suspended) {
          this.hide([ButtonActions.ACTIVATE]);
          this.disable([ButtonActions.ACTIVATE]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.SUSPEND]));
          this.enable([ButtonActions.SUSPEND, ButtonActions.DELETE]);
        } else {
          this.hide([ButtonActions.SUSPEND]);
          this.disable([ButtonActions.SUSPEND]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.ACTIVATE]));
          this.enable([ButtonActions.ACTIVATE, ButtonActions.DELETE]);
        }
        break;
      case ItemType.ProcessDefinition:
        if (!item.suspended) {
          this.diagramToolbar?.enable([ButtonActions.START_PROCESS]);
          this.hide([ButtonActions.ACTIVATE]);
          this.disable([ButtonActions.ACTIVATE]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.SUSPEND]));
          this.enable([ButtonActions.SUSPEND, ButtonActions.DELETE]);
        } else if (item.suspended) {
          this.diagramToolbar?.disable([ButtonActions.START_PROCESS]);
          this.hide([ButtonActions.SUSPEND]);
          this.disable([ButtonActions.SUSPEND]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.ACTIVATE]));
          this.enable([ButtonActions.ACTIVATE, ButtonActions.DELETE]);
        }
        break;
      case ItemType.ProcessInstance:
        if (item.state === ProcessInstanceStatesMap.ACTIVE.value) {
          this.diagramToolbar?.enable([ButtonActions.MOVE_TOKEN]);
          this.hide([ButtonActions.ACTIVATE]);
          this.disable([ButtonActions.ACTIVATE]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.SUSPEND]));
          this.enable([ButtonActions.SUSPEND, ButtonActions.TERMINATE]);
        } else if (item.state === ProcessInstanceStatesMap.SUSPENDED.value) {
          this.diagramToolbar?.disable([ButtonActions.MOVE_TOKEN]);
          this.hide([ButtonActions.SUSPEND]);
          this.disable([ButtonActions.SUSPEND]);
          this.show(await this.filterPermittedButtonActions(this._itemType, [ButtonActions.ACTIVATE]));
          this.enable([ButtonActions.ACTIVATE, ButtonActions.TERMINATE]);
        } else {
          this.diagramToolbar?.disable([ButtonActions.MOVE_TOKEN]);
          this.hide([ButtonActions.ACTIVATE, ButtonActions.SUSPEND, ButtonActions.TERMINATE]);
          this.disable([ButtonActions.ACTIVATE, ButtonActions.SUSPEND, ButtonActions.TERMINATE]);
        }
        break;
      case ItemType.DecisionDefinition:
        break;
      default:
        console.warn(`Toolbar item type "${this._itemType}" is not an expected type.`);
        break;
    }
  }

  private updateVisibility(btns: ButtonActions[], hide: boolean = true) {
    this.buttons?.forEach((toolbarButton) => {
      if (this.isFound(btns, toolbarButton)) {
        if (hide) toolbarButton.hide();
        else toolbarButton.show();
      }
    });
  }

  private updateEnabled(btns: ButtonActions[], enable: boolean = true) {
    this.buttons?.forEach((toolbarButton) => {
      if (this.isFound(btns, toolbarButton)) {
        if (enable) toolbarButton.enable();
        else toolbarButton.disable();
      }
    });
  }

  private isFound(btns: ButtonActions[], toolbarButton: ToolbarButtonComponent) {
    return btns.some((id) => id === toolbarButton.id);
  }

  private async filterPermittedButtonActions(itemType: ItemType, buttonActions: ButtonActions[], itemId?: string) {
    const promises = buttonActions.map(async (buttonAction) => {
      const requiredPermissions = getRequiredActionPermissions(itemType, buttonAction, itemId);
      const isPermitted = await this.permissionService.meetsPermissionSpecification(requiredPermissions);

      return { buttonAction, isPermitted };
    });

    const resolved = await Promise.all(promises);
    const filtered = resolved.filter((entry) => entry.isPermitted);

    return filtered.map((entry) => entry.buttonAction);
  }
}
