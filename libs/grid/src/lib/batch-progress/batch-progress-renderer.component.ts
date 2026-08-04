import { AgRendererComponent } from 'ag-grid-angular';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-batch-progress-cell',
  template: `
    <div class="border batch-progress-bar d-inline-block" [ngbTooltip]="getRatio()" container="body">
      <div class="batch-progress-completed position-relative text-center" [ngStyle]="{ width: getPercentage() }"></div>
    </div>
    <div class="d-inline-block progress-label">
      {{ getPercentage() }}
    </div>
  `,
  styleUrls: ['./batch-progress-renderer.component.scss'],
  standalone: false,
})
export class BatchProgressRendererComponent implements AgRendererComponent {
  public params: any;
  agInit(params: ICellRendererParams) {
    this.params = params;
  }

  refresh(params: ICellRendererParams) {
    this.params = params;
    return true;
  }

  getRatio() {
    const { completedJobs, totalJobs } = this.params.data;
    return `${completedJobs} / ${totalJobs}`;
  }

  getPercentage() {
    const { completedJobs, totalJobs } = this.params.data;
    return Math.round((completedJobs / totalJobs) * 100) + '%';
  }
}
