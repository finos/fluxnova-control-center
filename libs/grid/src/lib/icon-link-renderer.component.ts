import { ChangeDetectionStrategy, Component } from '@angular/core';
import Icons from '@fxn/common/src/assets/icons.svg';
import { ICellRendererParams } from 'ag-grid-community';
import { LinkRendererComponent } from './link-renderer.component';

@Component({
  selector: 'fluxnova-icon-link-cell',
  template: `
    <div #contents class="contents" [ngClass]="{ 'disabled-pointer-events': disabled }">
      <div #textLink class="textLink" fluxnovaTruncateWithTooltip>
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
      @if (iconIsInternalPath && shouldDisplayIcon(params)) {
        <a class="icon-link" [routerLink]="[iconHref]" [queryParams]="iconQueryParams">
          <svg
            class="grid-icon"
            [ngStyle]="this.iconColor ? { color: this.iconColor } : {}"
            fill="currentColor"
            [ngbTooltip]="tooltipText"
            [openDelay]="500"
            placement="right"
            container="body"
          >
            <use [attr.href]="icons + '#' + iconName" width="20" height="20"></use>
          </svg>
        </a>
      }
      @if (!iconIsInternalPath && shouldDisplayIcon(params)) {
        <a class="icon-link" href="{{ iconHref }}">
          <svg
            class="grid-icon"
            [ngStyle]="this.iconColor ? { color: this.iconColor } : {}"
            fill="currentColor"
            [ngbTooltip]="tooltipText"
            [openDelay]="500"
            placement="right"
            container="body"
          >
            <use [attr.href]="icons + '#' + iconName" width="20" height="20"></use>
          </svg>
        </a>
      }
    </div>
  `,
  styleUrls: ['./icon-link-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class IconLinkRendererComponent extends LinkRendererComponent {
  icons = Icons;
  iconName = '';
  iconColor = '';
  iconHref = '';
  iconQueryParams = '';
  tooltipText = '';
  iconIsInternalPath = true;

  override agInit(params: ICellRendererParams): void {
    super.agInit(params);

    this.iconName = params.colDef?.cellRendererParams?.iconName;
    this.iconColor = params.colDef?.cellRendererParams?.iconColor;
    this.tooltipText = params.colDef?.cellRendererParams?.tooltipText;
    this.iconHref = this.getIconHref(params);
    this.iconQueryParams = params.colDef?.cellRendererParams?.iconQueryParams;
    this.iconIsInternalPath = params.colDef?.cellRendererParams?.iconIsInternalLink;
  }

  shouldDisplayIcon(params?: ICellRendererParams): boolean {
    const conditionFn = params?.colDef?.cellRendererParams?.displayCondition;
    return conditionFn && params.data ? conditionFn(params.data) : false;
  }

  getIconHref(params: ICellRendererParams) {
    if (params.colDef?.cellRendererParams.iconPathParts) {
      return params.colDef?.cellRendererParams.iconPathParts.reduce(
        (previousValue: string, currentValue: string) =>
          previousValue.concat(currentValue.includes(':') ? params.data?.[currentValue.slice(1)] : currentValue, '/'),
        '',
      );
    }
  }
}
