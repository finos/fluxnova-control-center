import { Directive, ElementRef, HostBinding, HostListener, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { NgbTooltip, Placement } from '@ng-bootstrap/ng-bootstrap';

export interface TruncateTooltipOptions {
  placement?: Placement;
  container?: string;
  disabled?: boolean;
  target?: string;
  openDelay?: number;
}
@Directive({
  selector: '[fluxnovaTruncateWithTooltip]',
  hostDirectives: [NgbTooltip],
  standalone: false,
})
export class TruncateWithTooltipDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  @Input() fluxnovaTruncateWithTooltip?: TruncateTooltipOptions;
  private isTooltipInitialized = false;
  private targetElementRef = this.elementRef.nativeElement;
  tooltipDirective = inject(NgbTooltip);
  @HostBinding('class') elementClass = 'fluxnova-truncate-with-tooltip';
  @Input() customFormatter = (data: any) => data;

  @HostListener('mouseover') onMouseOver() {
    if (!this.fluxnovaTruncateWithTooltip?.disabled) {
      this.checkIsTruncated();
    }
  }

  ngOnInit() {
    this.tooltipDirective.placement = this.fluxnovaTruncateWithTooltip?.placement || 'auto';
    this.tooltipDirective.container = this.fluxnovaTruncateWithTooltip?.container || 'body';
    this.tooltipDirective.openDelay = this.fluxnovaTruncateWithTooltip?.openDelay || 500;
  }

  ngOnDestroy() {
    this.tooltipDirective.ngOnDestroy();
  }

  setTargetElement() {
    if (this.fluxnovaTruncateWithTooltip?.target) {
      this.targetElementRef =
        this.elementRef.nativeElement.querySelector(this.fluxnovaTruncateWithTooltip?.target) ||
        this.elementRef.nativeElement;
    }
  }

  checkIsTruncated() {
    this.setTargetElement();
    if (this.targetElementRef.offsetWidth < this.targetElementRef.scrollWidth) {
      //turns out we do need to truncate, jump back into zonejs to get change detection
      if (!this.isTooltipInitialized) {
        this.tooltipDirective.ngOnInit();
        this.isTooltipInitialized = true;
      }
      this.tooltipDirective.ngbTooltip = this.customFormatter(
        this.targetElementRef.innerText || this.targetElementRef.value,
      );
    } else {
      this.tooltipDirective.ngbTooltip = '';
    }
  }
}
