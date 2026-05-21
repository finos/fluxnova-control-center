import pluralize from 'pluralize';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'fluxnova-value-with-units',
  template: `{{ getFormattedValue() }}`,
  standalone: false,
})
export class ValueWithUnitsComponent {
  @Input() value?: number;
  @Input() unit?: 'day' | 'month' | 'year';

  constructor() {}

  getFormattedValue() {
    if (this.value === undefined) {
      return 'N/A';
    }

    if (this.value === 0) {
      return '0';
    }

    return `${this.value} ${pluralize(this.unit || '', this.value)}`;
  }
}
