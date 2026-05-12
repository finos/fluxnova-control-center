import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ContextMenuItemProperties {
  iconName: string;
  title: string;
  action: string;
}

@Component({
  selector: 'fluxnova-context-menu-item',
  template: `<div
    [class.disabled]="disabled"
    class="item fs-10 d-block p-1 whitespace-nowrap"
    (click)="click()"
    [attr.data-action]="action"
  >
    <fluxnova-icon [iconName]="iconName" class="ms-1 fs-9"></fluxnova-icon>
    {{ title }}
  </div>`,
  styleUrls: ['./context-menu.component.css'],
  standalone: false,
})
export class ContextMenuItemComponent {
  @Input() public action?: string;
  @Input() public iconName?: string;
  @Input() public title?: string;
  @Input() public disabled?: boolean = false;
  @Output() itemClickEvent = new EventEmitter<string>();

  constructor() {}

  protected click() {
    if (!this.disabled) {
      this.itemClickEvent.emit(this.action);
    }
  }
}
