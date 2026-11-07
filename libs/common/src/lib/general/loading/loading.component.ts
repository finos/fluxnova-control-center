import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fluxnova-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LoadingComponent {
  blockInteraction = false;
}
