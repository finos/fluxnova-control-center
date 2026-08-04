import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-history-link-cell',
  template: `
    <div #contents class="contents" fluxnovaTruncateWithTooltip>
      <a [routerLink]="[href]" queryParamsHandling="merge">{{ linkLabel }}</a>
    </div>
  `,
  styleUrls: ['./history-link-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HistoryLinkRendererComponent implements AgRendererComponent {
  private cd = inject(ChangeDetectorRef);

  public params?: ICellRendererParams;
  href?: string;
  linkLabel?: string;

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }

  getHref(params: ICellRendererParams) {
    const isTaskPage = params.value === 'task-detail';
    switch (params.data.level) {
      case 'Process':
        return isTaskPage ? `../process/${params.data.processInstanceId}` : `../${params.data.processInstanceId}`;
      case 'Task':
        return isTaskPage ? `../${params.data.taskId}` : `../../${params.data.taskId}`;
      default:
        console.warn('unknown history link');
        return `${params.value}`;
    }
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.href = this.getHref(params);
    this.linkLabel = params.data.level === 'Process' ? params.data.processInstanceId : params.data.taskId;
    this.cd.markForCheck();
    return true;
  }
}
