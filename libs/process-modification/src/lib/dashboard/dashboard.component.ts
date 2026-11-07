import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fluxnova-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DashboardComponent {}
