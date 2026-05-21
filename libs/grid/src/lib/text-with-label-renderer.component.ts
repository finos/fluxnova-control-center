import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
  selector: 'fluxnova-text-with-label-cell',
  template: ` @if (params.label || params.data[params.labelField]) {
    <div [fluxnovaTruncateWithTooltip] class="mt-2 mb-1 lh-1 fs-11 fw-bold">
      {{ params.label || params.data[params.labelField] }}:
    </div>
    <div class="lh-1" [ngClass]="{ 'text-primary': params.isOpenModalOnClick }" [fluxnovaTruncateWithTooltip]>
      {{ params.value }}
    </div>
  }`,
  standalone: false,
})
export class TextWithLabelRendererComponent implements AgRendererComponent {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }
}
