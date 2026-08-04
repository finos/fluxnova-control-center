import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface ActivityNameFromDomRendererParams extends ICellRendererParams {
  sourceField?: string;
}

@Component({
  selector: 'fluxnova-activity-grid-cell',
  template: '<p>{{ calledActivityName }}</p>',
  styleUrls: ['./activity-name-from-dom-renderer.component.scss'],
  standalone: false,
})
export class ActivityNameFromDomRendererComponent implements AgRendererComponent {
  private document = inject<Document>(DOCUMENT);

  calledActivityName = '';

  agInit(params: ActivityNameFromDomRendererParams): void {
    this.initCalledActivityName(params);
  }

  refresh(): boolean {
    return false;
  }

  private initCalledActivityName(params: ActivityNameFromDomRendererParams) {
    this.calledActivityName = this.getSvgCalledActivityElement(params);
  }

  private getSvgCalledActivityElement(params: ActivityNameFromDomRendererParams) {
    const sourceFieldValue = params?.data[params?.sourceField ?? 'activityId'];
    const innerLabelQuery = `[data-element-id="${sourceFieldValue}"] text`;
    const innerLabelText = this.document?.querySelector(innerLabelQuery)?.textContent;
    if (innerLabelText) {
      return innerLabelText;
    }
    const outerLabelQuery = `[data-element-id="${sourceFieldValue}_label"] text`;
    return this.document?.querySelector(outerLabelQuery)?.textContent ?? '';
  }
}
