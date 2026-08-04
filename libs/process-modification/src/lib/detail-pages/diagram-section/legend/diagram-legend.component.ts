import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { ThemeService } from '@fxn/common/src';
import { WINDOW } from 'ngx-window-token';

@Component({
  selector: 'fluxnova-diagram-legend',
  templateUrl: './diagram-legend.component.html',
  styleUrls: ['./diagram-legend.component.scss'],
  standalone: false,
})
export class DiagramLegendComponent {
  private win = inject<Window>(WINDOW);
  themeService = inject(ThemeService);

  @ViewChild('diagramLegend')
  public diagramLegend!: ElementRef;

  @Input() showIconsInLegend?: boolean;

  public colorData: Array<{ [key: string]: string }>;
  public legendStyle = { visibility: 'hidden', left: '0px', top: '0px' };

  constructor() {
    const themeService = this.themeService;

    const colors = themeService.getBpmnColors('default');
    this.colorData = [
      {
        fillColor: colors.completedTokenFill,
        strokeColor: colors.completedTokenStroke,
        label: 'Completed Successfully',
      },
      { fillColor: colors.incidentFill, strokeColor: colors.incidentStroke, label: 'Error / Incident' },
      { fillColor: colors.activeTokenFill, strokeColor: colors.activeTokenStroke, label: 'Current Status / Location' },
      { fillColor: colors.terminatedTokenFill, strokeColor: colors.terminatedTokenStroke, label: 'Terminated' },
    ];
  }

  protected calculatePosition(mouseX: number, mouseY: number) {
    const menuHeight = this.diagramLegend.nativeElement.getBoundingClientRect().height || 0;
    const menuWidth = this.diagramLegend.nativeElement.getBoundingClientRect().width || 0;
    const width = this.win.innerWidth || 0;
    const height = this.win.innerHeight || 0;

    return {
      left: width - mouseX < menuWidth ? mouseX - menuWidth : mouseX,
      top: height - mouseY <= menuHeight ? mouseY - menuHeight : mouseY,
    };
  }

  public open(event: MouseEvent) {
    event.preventDefault();
    const mouseX = event.clientX || 0;
    const mouseY = event.clientY || 0;

    this.legendStyle.visibility = 'visible';

    const position = this.calculatePosition(mouseX, mouseY);

    //display the menu
    this.legendStyle.visibility = 'visible';
    this.legendStyle.left = `${position.left}px`;
    this.legendStyle.top = `${position.top}px`;

    this.win.document.addEventListener('mouseup', this.close.bind(this));
  }

  public close(e: any, force: boolean = false) {
    if (!this.diagramLegend.nativeElement.contains(e.target) || force) this.legendStyle.visibility = 'hidden';

    this.win.document.removeEventListener('mouseup', this.close.bind(this));
  }
}
