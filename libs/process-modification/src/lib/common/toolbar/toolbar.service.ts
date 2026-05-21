import { EventEmitter, Injectable } from '@angular/core';
import { ToolbarEvent } from './toolbar.component';
import { ToolbarButtonComponent } from './toolbar-button.component';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  public emitter: EventEmitter<ToolbarEvent> = new EventEmitter<ToolbarEvent>();

  public leftButtonVisible(buttons: ToolbarButtonComponent[]) {
    return buttons.some((button) => button.iconName !== 'download' && !button.hidden);
  }

  public rightButtonVisible(buttons: ToolbarButtonComponent[]) {
    return buttons.some((button) => button.iconName === 'download' && !button.hidden);
  }
}
