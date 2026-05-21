import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'fluxnova-tab-actions-floating-container',
  templateUrl: './actions-floating-container.component.html',
  styleUrls: ['./actions-floating-container.component.scss'],
  standalone: false,
})
export class ActionsFloatingContainerComponent {
  @Input() showResetGridButton = false;
  @Output()
  public resetGridClicked: EventEmitter<void> = new EventEmitter<void>();

  onResetGridClicked(): void {
    this.resetGridClicked.emit();
  }
}
