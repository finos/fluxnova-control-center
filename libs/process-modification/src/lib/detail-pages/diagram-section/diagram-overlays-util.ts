import NavigatedViewer from 'bpmn-js/lib/Viewer';
import ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import { getBpmnColors } from '@fxn/common';
import Icons from '@fxn/common/src/assets/icons.svg';
import * as TokenIcons from '../../common/token-icons';
import { ContextMenuItemAction } from './context-menu/context-menu-item.service';

const MAX_DISPLAY_COUNT = '99+';
const TOOLTIP_DELAY = 800;
const TOKEN_TOP_ALIGNMENT = -15;
const TOKEN_TOOLTIP_TOP_ALIGNMENT = -45;
const TOKEN_BOTTOM_ALIGNMENT = 18;
const TOKEN_TOOLTIP_BOTTOM_ALIGNMENT = -15;
const TOKEN_TYPES: { [key: string]: any } = {
  'active-token': {
    color: getBpmnColors('default').activeTokenFill,
    strokeColor: getBpmnColors('default').activeTokenStroke,
    alignmentOffset: 0,
    orderOnShape: 1,
    tooltipText: 'Running Activity Instances',
    tooltipAlignmentOffset: 70.5,
  },
  'terminated-token': {
    color: getBpmnColors('default').terminatedTokenFill,
    strokeColor: getBpmnColors('default').terminatedTokenStroke,
    alignmentOffset: 40,
    orderOnShape: 3,
    tooltipText: 'Terminated Activity Instances',
    tooltipAlignmentOffset: 78.5,
  },
  'completed-token': {
    color: getBpmnColors('default').completedTokenFill,
    strokeColor: getBpmnColors('default').completedTokenStroke,
    alignmentOffset: 60,
    orderOnShape: 4,
    tooltipText: 'Completed Activity Instances',
    tooltipAlignmentOffset: 78.5,
  },
};

export class DiagramOverlaysUtil {
  get overlays(): any {
    return this.navigatedViewer.get('overlays');
  }

  public get colorService(): any {
    return this.navigatedViewer?.get('colorRenderer');
  }

  public get selectionService(): any {
    return this.navigatedViewer?.get('selection');
  }

  public get diagramEventBus(): any {
    return this.navigatedViewer?.get('eventBus');
  }

  public get elementRegistry(): any {
    return this.navigatedViewer.get<ElementRegistry>('elementRegistry');
  }

  public get canvas(): any {
    return this.navigatedViewer.get('canvas');
  }

  constructor(
    private readonly navigatedViewer: NavigatedViewer,
    private readonly diagramDiv: any,
  ) {}

  public addTokenToDiagram(
    activityId: string,
    count: number,
    tokenType: 'active-token' | 'terminated-token' | 'completed-token',
  ) {
    const token = TOKEN_TYPES[tokenType];

    const tokenOverlay = document.createElement('svg');
    tokenOverlay.innerHTML = this.getTokenSvg(activityId, count, token.color, token.strokeColor, tokenType);

    const shapeWidth = this.elementRegistry.get(activityId)?.width;
    const spaceBetweenTokens = (shapeWidth - 80) / 5;
    const alignment = spaceBetweenTokens * token.orderOnShape + token.alignmentOffset;

    this.addTooltip(tokenOverlay, activityId, `${count} ${token.tooltipText}`, {
      bottom: TOKEN_TOOLTIP_BOTTOM_ALIGNMENT,
      left: alignment,
    });

    this.overlays.add(activityId, {
      position: { bottom: TOKEN_BOTTOM_ALIGNMENT, left: alignment },
      html: tokenOverlay,
    });
  }

  protected addTooltip(
    overlayElement: HTMLElement,
    activityId: string,
    tooltipText: string,
    tooltipPosition: { bottom?: number; top?: number; left?: number | string; right?: number },
  ) {
    let tooltipOverlay: any;
    let timeoutId: NodeJS.Timeout;
    overlayElement.addEventListener('mouseenter', () => {
      timeoutId = setTimeout(() => {
        tooltipOverlay = this.overlays.add(activityId, {
          position: tooltipPosition,
          html: this.getTokenTooltipHtml(tooltipText, activityId, tooltipPosition.top === undefined),
        });

        this.diagramDiv.querySelector(`#tooltip-${activityId}`).parentElement.style['position'] = 'relative';
        this.diagramDiv.querySelector(`#tooltip-${activityId}`).parentElement.style['left'] =
          `calc(${tooltipPosition.left}px - 50% + 10px)`;
        if (!tooltipPosition.left) {
          this.diagramDiv.querySelector(`#tooltip-${activityId}`).parentElement.style.removeProperty('left');
        }
        this.diagramDiv.querySelector(`#tooltip-${activityId}`).parentElement.style['right'] =
          `calc(${tooltipPosition.right}px + 50% - 10px)`;
      }, TOOLTIP_DELAY);
    });

    overlayElement.addEventListener('mouseleave', () => {
      clearTimeout(timeoutId);
      if (tooltipOverlay) {
        this.overlays.remove(tooltipOverlay);
      }
    });
  }

  public colorFlows(shapes: { id: string; element: any }[], highlightFlows: boolean = false) {
    shapes.forEach((activity) => {
      this.colorService?.drawConnection(
        activity.element,
        this.elementRegistry.get(activity.id),
        highlightFlows
          ? {
              stroke: getBpmnColors('default').completedTokenStroke,
              fill: getBpmnColors('default').completedTokenStroke,
            }
          : { stroke: 'black', fill: 'black' },
      );
    });
  }

  public addIncidentTokenToDiagram(activityId: string, count: number): void {
    if (this.navigatedViewer && this.elementRegistry.get(activityId)) {
      const overlayElement = document.createElement('svg');
      overlayElement.innerHTML = this.getTokenSvg(
        activityId,
        count,
        getBpmnColors('default').incidentFill,
        getBpmnColors('default').incidentStroke,
        'incident-diagram-icon',
      );

      const shapeWidth = this.elementRegistry.get(activityId)?.width;
      const spacingBetweenItems = (shapeWidth - 80) / 5;
      const leftAlignment = spacingBetweenItems * 2 + 20;

      this.addTooltip(overlayElement, activityId, `${count} Open Incidents`, {
        bottom: TOKEN_TOOLTIP_BOTTOM_ALIGNMENT,
        left: leftAlignment,
      });

      this.overlays.add(activityId, {
        position: { bottom: TOKEN_BOTTOM_ALIGNMENT, left: leftAlignment },
        html: overlayElement,
      });
    }
  }

  public addSuspendToDiagram(activityId: string): void {
    if (this.navigatedViewer && this.elementRegistry.get(activityId)) {
      const overlayElement = document.createElement('svg');
      overlayElement.innerHTML = this.getTokenSvg(
        activityId,
        -1,
        getBpmnColors('default').suspendedFill,
        getBpmnColors('default').suspendedStroke,
        'suspended-token',
      );
      const rightAlignment = 10;
      const shapeWidth = this.elementRegistry.get(activityId)?.width;

      this.addTooltip(overlayElement, activityId, 'Suspended Job Definition', {
        top: TOKEN_TOOLTIP_TOP_ALIGNMENT,
        right: rightAlignment - shapeWidth,
      });

      this.overlays.add(activityId, 'suspended-token', {
        position: { top: TOKEN_TOP_ALIGNMENT, right: rightAlignment },
        html: overlayElement,
      });
    }
  }

  public removeSuspendFromDiagram(activityId: string): void {
    if (this.navigatedViewer && this.elementRegistry.get(activityId)) {
      this.overlays.remove({
        element: activityId,
        type: 'suspended-token',
      });
    }
  }

  public overlayTokenOnShape(action: ContextMenuItemAction, target: any, isElementFlow: boolean = false) {
    if (this.navigatedViewer && this.elementRegistry.get(target.id)) {
      let position: any;
      let leftAlignment: number;
      let tooltipText: string;
      let tooltipPosition: any;
      const isAddTokenAction = action === ContextMenuItemAction.ADD_TOKEN;

      if (isElementFlow) {
        leftAlignment = -10;
        position = { top: -16, left: leftAlignment };
        tooltipPosition = { top: 16, left: leftAlignment };
        tooltipText = 'Add Token to Flow';
      } else {
        const shapeWidth = this.elementRegistry.get(target.id).width;
        leftAlignment = (shapeWidth - 80) / 5;
        position = { bottom: TOKEN_BOTTOM_ALIGNMENT, left: leftAlignment };
        tooltipPosition = { bottom: TOKEN_TOOLTIP_BOTTOM_ALIGNMENT, left: leftAlignment };
        tooltipText = isAddTokenAction ? 'Add Token to Activity' : 'Remove Token from Activity';
      }

      const overlayElement = document.createElement('svg');
      overlayElement.innerHTML = isAddTokenAction ? TokenIcons.ADD_TOKEN : TokenIcons.REMOVE_TOKEN;

      this.addTooltip(overlayElement, target.id, tooltipText, tooltipPosition);

      this.overlays.add(target.id, action.toString(), {
        position,
        html: overlayElement,
      });
    }
  }

  public getTokenSvg(
    activityId: string,
    count: number,
    fillColor: string,
    strokeColor: string,
    tokenType: string,
  ): string {
    const circleElement = this.getCircleElement(fillColor, strokeColor);
    const contentElement = this.getContentElement(tokenType, count);

    return `<svg width="20" height="20" viewBox="0 0 45 45" fill="none" data-stat-id="${activityId}" class="${tokenType}">
      ${circleElement}
      ${contentElement}
    </svg>`;
  }

  private getCircleElement(fillColor: string, strokeColor: string): string {
    return `<circle cx="22.5" cy="22.5" r="21" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3"/>`;
  }

  private getContentElement(tokenType: string, count: number): string {
    return tokenType === 'suspended-token' ? this.getSuspendedTokenElement() : this.getTextElement(count);
  }

  private getSuspendedTokenElement(): string {
    return `<svg viewBox="0 0 30 30">
        <use href="${Icons}#pause" x="5" y="5"/>
    </svg>`;
  }

  private getTextElement(count: number): string {
    const fontSize = count < 10 ? 26 : count <= 99 ? 22 : 20;
    const displayCount = count > 99 ? MAX_DISPLAY_COUNT : count;

    return `<text x="50%" y="58%" font-size="${fontSize}px" dominant-baseline="middle" text-anchor="middle" fill="#000000">${displayCount}</text>`;
  }

  public getTokenTooltipHtml(tooltipText: string, activityId: string, bottom: boolean = true) {
    return `<div id="tooltip-${activityId}" class="overlay-tooltip">
                    <span class="${bottom ? 'overlay-tooltip-span' : 'overlay-top-tooltip-span'}">${tooltipText}</span>
            </div>`;
  }

  public highlightActivityId(activityId: string) {
    this.clearActivityHighlight(activityId);

    if (activityId) {
      const activityElement = this.elementRegistry.get(activityId);
      this.selectionService?.select(activityElement);
    } else {
      this.selectionService?.select(null);
    }
  }

  public clearActivityHighlight(activityId: string) {
    const activityElement = this.elementRegistry.get(activityId || '');
    this.selectionService?.deselect(activityElement);
  }

  public clearToken(element: any) {
    this.overlays.remove({ element });
  }

  public removeAllTokenOverlays(activityId?: string) {
    this.overlays?.remove({ type: ContextMenuItemAction.ADD_TOKEN, ...(activityId && { element: activityId }) });
    this.overlays?.remove({ type: ContextMenuItemAction.REMOVE_TOKEN, ...(activityId && { element: activityId }) });
  }

  public static getInstance(navigatedViewer: NavigatedViewer, diagramDiv: any): DiagramOverlaysUtil {
    return new DiagramOverlaysUtil(navigatedViewer, diagramDiv);
  }

  public handleShapeEnter(element: any) {
    this.canvas.addMarker(element, 'hovered');
    if (element.label) {
      this.canvas.addMarker(element.label, 'hovered');
    }
    if (element.labelTarget) {
      this.canvas.addMarker(element.labelTarget, 'hovered');
    }
  }

  public handleShapeExit(element: any) {
    this.canvas.removeMarker(element, 'hovered');
    if (element.label) {
      this.canvas.removeMarker(element.label, 'hovered');
    }
    if (element.labelTarget) {
      this.canvas.removeMarker(element.labelTarget, 'hovered');
    }
  }

  public updateDiagramOpacity(selectedActivityId?: string) {
    const allElements = this.elementRegistry.getAll();

    if (selectedActivityId) {
      allElements.forEach((element: any) => {
        if (element.type === 'label') {
          if (element.labelTarget.id === selectedActivityId) {
            this.canvas.removeMarker(element, 'dimmed');
          } else {
            this.canvas.addMarker(element, 'dimmed');
          }
          return;
        }

        if (selectedActivityId === element.id) {
          this.canvas.removeMarker(element, 'dimmed');
        } else {
          this.canvas.addMarker(element, 'dimmed');
        }
      });
    } else {
      allElements.forEach((element: any) => {
        this.canvas.removeMarker(element, 'dimmed');
      });
    }
  }
}
