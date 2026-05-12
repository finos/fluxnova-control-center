import { Component, ViewEncapsulation } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ItemType } from '@fxn/types';

@Component({
  selector: 'fluxnova-edit-controls-cell',
  template: `
    @if (showEditButton()) {
      <button
        class="btn btn-sm p-0 me-2 edit-variable-button shadow-none"
        id="edit-variable"
        (click)="editButtonClicked()"
        aria-label="Edit Variable"
        *fluxnovaHasPermissions="{
          action: 'ModifyProcessInstanceVariables',
          resources: [
            { itemType: ItemType.ProcessDefinition, itemId: params.data.processDefinitionId },
            { itemType: ItemType.ProcessInstance, itemId: params.data.processInstanceId },
          ],
        }"
      >
        <fluxnova-icon class="text-primary fs-8" iconName="edit"></fluxnova-icon>
      </button>
    }
    <button
      class="btn btn-sm ms-2 me-1 p-0 shadow-none delete-variable-button"
      id="delete-variable"
      (click)="deleteButtonClicked()"
      aria-label="Delete Variable"
      *fluxnovaHasPermissions="{
        action: 'ModifyProcessInstanceVariables',
        resources: [
          { itemType: ItemType.ProcessDefinition, itemId: params.data.processDefinitionId },
          { itemType: ItemType.ProcessInstance, itemId: params.data.processInstanceId },
        ],
      }"
    >
      <fluxnova-icon class="text-primary fs-8" iconName="trash-filled-icon"></fluxnova-icon>
    </button>
  `,
  styleUrls: ['./edit-variables-controls-renderer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class EditVariablesControlsRendererComponent implements AgRendererComponent {
  params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  deleteButtonClicked() {
    this.params.context.componentParent.deleteClicked(this.params.node.rowIndex, this.params.node.data);
  }

  editButtonClicked() {
    this.params.context.componentParent.editClicked(this.params.node.rowIndex);
  }

  showEditButton(): boolean {
    return this.params.colDef?.cellRendererParams?.showEdit?.(this.params) ?? true;
  }

  refresh(): boolean {
    return false;
  }

  protected readonly ItemType = ItemType;
}
