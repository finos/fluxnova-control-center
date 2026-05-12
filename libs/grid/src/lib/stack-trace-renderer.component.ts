import { Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CodeModalComponent, GeneralModule, MODAL_DEFAULTS } from '@fxn/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'fluxnova-stack-trace-renderer',
  template: `<div class="contents" id="open-stack-trace" fluxnovaTruncateWithTooltip (click)="openStackTraceModal()">
    <span class="text-primary highlight-hover">
      {{ message }}
    </span>
  </div>`,
  imports: [GeneralModule],
})
export class StackTraceRendererComponent implements AgRendererComponent {
  private modalService = inject(NgbModal);
  private http = inject(HttpClient);

  message = '';
  jobId = '';
  incidentType = '';
  modal?: NgbModalRef;

  agInit(params: ICellRendererParams): void {
    this.message = params.value;
    this.jobId = params.data.configuration;
    this.incidentType = params.data.incidentType;
  }

  refresh(params: ICellRendererParams): boolean {
    this.message = params.value;
    this.jobId = params.data.configuration;
    return true;
  }

  openStackTraceModal() {
    this.modal = this.modalService.open(CodeModalComponent, {
      ...MODAL_DEFAULTS,
      size: 'xl',
    });
    const component = this.modal?.componentInstance as CodeModalComponent;
    component.title = 'Stack Trace';
    const url =
      this.incidentType === 'failedExternalTask'
        ? `api/external-tasks/${this.jobId}/errorDetails`
        : `api/jobs/${this.jobId}/stacktrace`;
    this.http.get(url, { responseType: 'text' }).subscribe((stackTrace) => {
      component.code = stackTrace;
    });
  }
}
