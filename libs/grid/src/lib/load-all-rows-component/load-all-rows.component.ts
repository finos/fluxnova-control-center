import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'fluxnova-load-all-rows-component',
  templateUrl: './load-all-rows.component.html',
  styleUrls: ['./load-all-rows.component.scss'],
  standalone: false,
})
export class LoadAllRowsComponent implements ICellRendererAngularComp {
  agInit(): void {}

  refresh(): boolean {
    return false;
  }
}
