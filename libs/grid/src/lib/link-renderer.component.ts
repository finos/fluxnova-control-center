import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { isString } from 'lodash-es';
import { ItemDetailQueryParams } from '@fxn/types';

@Component({
  selector: 'fluxnova-link-cell',
  template: `
    <div #contents class="contents" [ngClass]="{ 'disabled-pointer-events': disabled }" fluxnovaTruncateWithTooltip>
      @if (isInternalPath) {
        <a
          class="text-primary highlight-hover"
          [ngClass]="{ 'text-dark': disabled }"
          [routerLink]="[href]"
          [queryParams]="queryParams"
          >{{ params.value }}</a
        >
      }
      @if (!isInternalPath) {
        <a class="text-primary highlight-hover" href="{{ href }}">{{ params.value }}</a>
      }
    </div>
  `,
  styleUrls: ['./link-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LinkRendererComponent implements AgRendererComponent {
  cd = inject(ChangeDetectorRef);

  public params?: ICellRendererParams;
  public isInternalPath = true;
  href?: string;
  queryParams?: ItemDetailQueryParams;
  disabled = false;
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isInternalPath = this.isInternal(params);
    this.href = this.getHref(params);
    this.queryParams = this.getQueryParams(params);
    this.disabled = this.getIsDisabled(params);
  }

  getHref(params: ICellRendererParams) {
    if (params.colDef?.cellRendererParams) {
      return this.getHrefByCellRendererParams(params);
    }
    switch (params.colDef?.field) {
      case 'processInstanceId':
      case 'rootProcessInstanceId':
      case 'superProcessInstanceId':
        return `../process-instances/${params.value}`;
      case 'processDefinitionId':
        return `../process-definitions/${params.value}`;
      case 'deploymentId':
        return `../deployments/${params.value}`;
      case 'processDefinitionName':
        return `../../process-definitions/${params.data.processDefinitionId}`;
      case 'id':
      default:
        return `${params.value}`;
    }
  }

  getHrefByCellRendererParams(params: ICellRendererParams) {
    if (params.colDef?.cellRendererParams.pathParts) {
      return params.colDef?.cellRendererParams.pathParts.reduce(
        (previousValue: string, currentValue: string) =>
          previousValue.concat(currentValue.includes(':') ? params.data?.[currentValue.slice(1)] : currentValue, '/'),
        '',
      );
    } else {
      const { path, pathParamField } = params.colDef?.cellRendererParams || {};
      const pathParamValue = params?.data?.[pathParamField] || params.value;
      return [path, pathParamValue].join('/');
    }
  }

  getIsDisabled(params: ICellRendererParams) {
    const requiredFieldToEnableLink = params.colDef?.cellRendererParams?.requiredFieldToEnableLink;
    return !!requiredFieldToEnableLink && !params?.data?.[requiredFieldToEnableLink];
  }

  getQueryParams(params: ICellRendererParams) {
    if (params.colDef?.cellRendererParams?.queryParams) {
      return params.colDef?.cellRendererParams?.queryParams;
    }

    switch (params.colDef?.cellRendererParams?.queryParamType) {
      case 'incidentId':
        return {
          tab: 'incidents',
          incidentId: this.params?.data?.id,
          activityId: this.params?.data?.activityId,
        };
      case 'jobId':
        return {
          tab: 'jobs',
          jobId: params.value,
          activityId: this.params?.data?.failedActivityId,
        };
      case 'jobDefinitionId':
        return {
          tab: 'job-definitions',
          jobDefinitionId: params.value,
          activityId: this.params?.data?.jobDefinition?.activityId || this.params?.data?.failedActivityId,
        };
      default:
        return {};
    }
  }

  isInternal(params: ICellRendererParams) {
    return (
      !params.value ||
      params.colDef?.cellRendererParams?.isInternalLink ||
      (isString(params.value) && !(params.value.startsWith('http://') || params.value.startsWith('https://')))
    );
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.isInternalPath = this.isInternal(params);
    this.href = this.getHref(params);
    this.queryParams = this.getQueryParams(params);
    this.disabled = this.getIsDisabled(params);
    this.cd.markForCheck();
    return true;
  }
}
