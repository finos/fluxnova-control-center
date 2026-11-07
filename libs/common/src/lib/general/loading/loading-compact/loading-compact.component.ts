import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fluxnova-loading-compact',
  templateUrl: './loading-compact.component.html',
  styleUrls: ['./loading-compact.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LoadingCompactComponent {
  constructor() {}
}
