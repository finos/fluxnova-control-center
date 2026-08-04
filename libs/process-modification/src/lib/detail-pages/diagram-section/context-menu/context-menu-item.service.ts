import { inject, Injectable } from '@angular/core';
import { ActivityInstance, CompleteActivityInstanceInfo } from '@fxn/types';
import { some } from 'lodash-es';
import { DiagramUtilsService } from '../../../common/diagram/services';
import { ContextMenuItemProperties } from './context-menu-item.component';

export enum ContextMenuItemAction {
  ADD_TOKEN = 'add_token',
  REMOVE_TOKEN = 'remove_token',
  REDO = 'redo',
  UNDO = 'undo',
}

@Injectable({
  providedIn: 'root',
})
export class ContextMenuItemService {
  private diagramUtils = inject(DiagramUtilsService);

  private availableItems = {
    addToken: { iconName: 'add-plus', title: 'Add Token', action: ContextMenuItemAction.ADD_TOKEN },
    redo: { iconName: 'redo', title: 'Redo', action: ContextMenuItemAction.REDO },
    removeToken: {
      iconName: 'remove-trash',
      title: 'Remove Token',
      action: ContextMenuItemAction.REMOVE_TOKEN,
    },
    undo: { iconName: 'undo', title: 'Undo', action: ContextMenuItemAction.UNDO },
  };

  public getProcessInstanceMenuItems(element: any): ContextMenuItemProperties[] {
    const items: ContextMenuItemProperties[] = [];

    if (!this.diagramUtils.elementIsProcess(element)) {
      items.push(this.availableItems.addToken);
      items.push(this.availableItems.removeToken);
    }

    items.push(this.availableItems.redo);
    items.push(this.availableItems.undo);

    return items;
  }

  public elementHasActiveInstance(element: any, activityInstances?: CompleteActivityInstanceInfo): boolean {
    let flattenedChildren: ActivityInstance[] = [];

    if (activityInstances?.active?.childActivityInstances) {
      flattenedChildren = this.flattenActivities(activityInstances?.active?.childActivityInstances);
    }

    return (
      some(
        activityInstances?.active?.childActivityInstances,
        (activityInstance: ActivityInstance) => activityInstance.activityId === element.id,
      ) ||
      some(
        activityInstances?.active?.childTransitionInstances,
        (activityInstance: ActivityInstance) => activityInstance.activityId === element.id,
      ) ||
      some(flattenedChildren, (activityInstance: ActivityInstance) => activityInstance.activityId === element.id)
    );
  }

  private flattenActivities(instanceArray: ActivityInstance[]) {
    let result: ActivityInstance[] = [];

    instanceArray.forEach((instance) => {
      result.push(instance);

      if (instance.childActivityInstances && instance.childActivityInstances.length > 0) {
        result = result.concat(this.flattenActivities(instance.childActivityInstances));
      }

      if (instance.childTransitionInstances && instance.childTransitionInstances.length > 0) {
        result = result.concat(instance.childTransitionInstances);
      }
    });
    return result;
  }
}
