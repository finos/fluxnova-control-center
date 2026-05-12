import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ToggleFilter } from '@fxn/types/src';

@Component({
  selector: 'fluxnova-toggle-filters',
  templateUrl: './toggle-filters.component.html',
  styleUrls: [],
  standalone: false,
})
export class ToggleFiltersComponent {
  @Input() toggleFilters?: ToggleFilter[];
  @Input() isResetVisible?: boolean;
  @Output() resetToggles = new EventEmitter();
  @Output() selectToggle = new EventEmitter<ToggleFilter>();

  constructor() {}
}
