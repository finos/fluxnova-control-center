import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
  selector: 'fluxnova-epoch-date-cell',
  template: `
    <div #contents class="contents" fluxnovaTruncateWithTooltip>
      {{ params.value | fluxnovaDate }}
    </div>
  `,
  styleUrls: ['./date-renderer.component.scss'],
  standalone: false,
})
export class DateRendererComponent implements ICellRendererAngularComp {
  public params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }
}
