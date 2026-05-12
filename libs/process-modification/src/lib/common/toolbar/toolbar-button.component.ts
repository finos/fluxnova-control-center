import { Component, inject, Input } from '@angular/core';
import { ToolbarService } from './toolbar.service';

@Component({
  selector: 'fluxnova-toolbar-button',
  templateUrl: './toolbar-button.component.html',
  styleUrls: [],
  standalone: false,
})
export class ToolbarButtonComponent {
  private toolbarService = inject(ToolbarService);

  @Input() iconName = '';
  @Input() iconColor = '';
  @Input() text = '';
  @Input() id = '';
  @Input() btnClass?: string = 'btn action-btn';
  @Input() slot?: string;
  @Input() tooltip?: string;

  enabled = false;
  hidden = true;

  protected click() {
    this.toolbarService.emitter.next({ target: this.id, action: 'click' });
  }

  public hide() {
    this.hidden = true;
  }

  public show() {
    this.hidden = false;
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }
}
