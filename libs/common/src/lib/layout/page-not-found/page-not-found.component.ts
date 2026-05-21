import { Component, Input } from '@angular/core';

@Component({
  selector: 'fluxnova-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [],
  standalone: false,
})
export class PageNotFoundComponent {
  @Input() itemType?: string;
  constructor() {}
}
