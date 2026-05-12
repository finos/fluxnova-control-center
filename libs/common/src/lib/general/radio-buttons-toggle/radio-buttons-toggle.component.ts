import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface RadioButtonItem {
  name: string;
  value: string;
  checked?: boolean;
}

@Component({
  selector: 'fluxnova-radio-buttons-toggle',
  templateUrl: './radio-buttons-toggle.component.html',
  styleUrls: ['./radio-buttons-toggle.component.scss'],
  standalone: false,
})
export class RadioButtonsToggleComponent {
  @Input() radioButtons: RadioButtonItem[] = [];
  @Output() toggleUpdateRadioButtons: EventEmitter<string> = new EventEmitter();
  constructor() {}

  handleButtonClick(radioValue: string, index: number): void {
    this.radioButtons[index].checked = true;
    this.toggleUpdateRadioButtons.emit(radioValue);
  }
}
