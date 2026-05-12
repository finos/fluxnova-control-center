import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'fluxnova-tabs-view',
  templateUrl: './tabs-view.component.html',
  styleUrls: ['./tabs-view.component.scss'],
  standalone: false,
})
export class TabsViewComponent {
  public hoveredTab?: string;
  @Input() activeTab?: string;
  @Input() tabs: string[] = [];
  @Input() tabCounts: { [tab: string]: number } = {};
  @Input() enforceCapitalCase = true;
  @Output() activeTabsChange = new EventEmitter<string>();
}
