import { AgRendererComponent } from 'ag-grid-angular';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-job-state-cell',
  template: ` <div>{{ getState() }}</div> `,
  standalone: false,
})
export class JobStateRendererComponent implements AgRendererComponent {
  public params: any;
  agInit(params: ICellRendererParams) {
    this.params = params;
  }

  refresh(params: ICellRendererParams) {
    this.params = params;
    return true;
  }

  getState() {
    const { failureLog, deletionLog, creationLog, successLog } = this.params.data;
    if (failureLog) return 'Failure';
    if (deletionLog) return 'Deletion';
    if (creationLog) return 'Creation';
    if (successLog) return 'Success';
    return 'Info';
  }
}
