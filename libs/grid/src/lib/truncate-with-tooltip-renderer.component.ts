import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { isString } from 'lodash-es';

/**
 * Note, this switch between a template with innerHTML and one that just uses text content
 * is for performance reasons. Most cells just use text and will not need html. The
 * only place we currently render html is for cells that have matching search
 * text highlighted with <mark> tags.
 */
@Component({
  selector: 'fluxnova-truncate-with-tooltip-cell',
  template: `
    @if (isHtml) {
      <div class="contents" fluxnovaTruncateWithTooltip [innerHTML]="value"></div>
    } @else {
      <div class="contents" fluxnovaTruncateWithTooltip>{{ value }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TruncateWithTooltipRendererComponent implements ICellRendererAngularComp {
  private cd = inject(ChangeDetectorRef);

  isHtml = false;
  value?: string;

  agInit(params: any): void {
    this.value = params.value;
    this.updateHtmlFlag();
  }

  refresh(params: any): boolean {
    this.value = params.value;
    this.updateHtmlFlag();
    this.cd.markForCheck();
    return true;
  }

  private updateHtmlFlag() {
    this.isHtml = isString(this.value) && (this.value.indexOf('<mark>') !== -1 || this.value.indexOf('<b>') !== -1);
  }
}
