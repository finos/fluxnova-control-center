/* eslint-disable max-lines */
import { ElementRef } from '@angular/core';
import { delay, Subscription, take, timer } from 'rxjs';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { ButtonActions, CompleteActivityInstanceInfo, Job } from '@fxn/types';
import Heatmap, { HeatmapData, HeatmapParams } from 'visual-heatmap';
import { DiagramUtilsService } from '../common/diagram/services';
import { GenericDiagramSectionViewComponent } from '../common/diagram/generic-diagram-viewer.component';
import { HeatmapUtil } from './diagram-section/heatmap-util';
import { ItemDetailPageComponent } from './item-detail-page.component';
import { DiagramOverlaysUtil } from './diagram-section/diagram-overlays-util';
import { DiagramAnimationUtil } from './diagram-section/diagram-animation-util';
import {
  ContextMenuItemAction,
  ContextMenuItemService,
} from './diagram-section/context-menu/context-menu-item.service';
import { PimCommandStackService } from './diagram-section/pim-command-stack.service';
import { ContextMenuClickEvent, ContextMenuComponent } from './diagram-section/context-menu/context-menu.component';
import { ContextMenuItemProperties } from './diagram-section/context-menu/context-menu-item.component';

export interface AugmentedProcessDiagram {
  diagramRendered: boolean;
  diagramOverlaysUtil?: DiagramOverlaysUtil;
  diagramComponent?: GenericDiagramSectionViewComponent;
  itemId: string;
  selectedActivityId?: string;
  EVENT_PRIORITY: number;

  highlightActivity(activityId: string): void;
  clearActivityHighlight(activityId: string): void;
  showIncidentTokensOnDiagram(): void;
  onDiagramRendered(rendered: boolean): void;
}

export enum ActivityMarkers {
  CANCELED = 'canceled',
  COMPLETED = 'completedSuccess',
  IN_PROGRESS = 'inProgress',
  INCIDENT = 'incident',
  SOLID_PATHS = 'solid-paths',
}

export interface ActivityIncident {
  totalIncidents: number;
  failedActivityId: string;
}

export interface SequenceFlow {
  sequenceId: string;
  sourceActivityId: string | null;
  targetActivityId: string | null;
}

/**
 * This function adds overlaying tokens and highlighting of shapes to ItemDetailPages.
 *
 * @param Base
 * @constructor
 */
export function WithAugmentedProcessDiagram<TBase extends new (...args: any[]) => ItemDetailPageComponent>(
  Base: TBase,
) {
  return class extends Base implements AugmentedProcessDiagram {
    readonly EVENT_PRIORITY = 99999;
    readonly FOCUS_SHAPE_ZOOM_LEVEL = 1;
    readonly ANIMATION_DURATION = 500;
    readonly DELAY_BETWEEN_ANIMATIONS = 250;

    diagramRendered = false;
    diagramOverlaysUtil?: DiagramOverlaysUtil;
    diagramComponent?: GenericDiagramSectionViewComponent;
    incidents?: ActivityIncident[];
    jobDefinitions?: Job[];
    selectedActivityId?: string;
    filteredActivityId?: string;
    hoveredElement?: any;

    highlightActivity(activityId: string = '') {
      if (this.diagramRendered) this.diagramOverlaysUtil?.highlightActivityId(activityId);
    }

    clearActivityHighlight(activityId: string = '') {
      const activityElement = this.diagramOverlaysUtil?.elementRegistry.get(activityId || '');
      this.diagramOverlaysUtil?.selectionService?.deselect(activityElement);
    }

    onDiagramRendered(rendered: boolean) {
      if (!rendered) {
        this.eventBus.setDiagramRendered(false);
        return;
      }
      this.toolbar?.enable([ButtonActions.DOWNLOAD_RESOURCE]);
      this.diagramRendered = true;
      this.diagramOverlaysUtil = DiagramOverlaysUtil.getInstance(
        this.diagramComponent?.navigatedViewer as NavigatedViewer,
        this.diagramComponent?.diagramContainerDiv?.nativeElement ?? {},
      );

      this.highlightActivity(this.selectedActivityId);
      if (this.selectedActivityId) {
        this.centerElement(this.selectedActivityId);
      }
      this.setupActivityBehaviors();
      this.eventBus.setDiagramRendered(true);
      this.markupDiagram();
      this.diagramOverlaysUtil?.updateDiagramOpacity(this.route.snapshot.queryParams.filteredActivityId);
    }

    markupDiagram() {
      this.showIncidentTokensOnDiagram();
      this.updateJobDefinitionsOverlayOnDiagram();
    }

    setupActivityBehaviors() {
      this.diagramOverlaysUtil?.diagramEventBus?.on('selection.changed', this.onSelectionChanged.bind(this));
      this.diagramOverlaysUtil?.diagramEventBus?.on(
        'element.hover',
        this.EVENT_PRIORITY,
        this.onElementHover.bind(this),
      );
      this.diagramOverlaysUtil?.diagramEventBus.on('element.click', this.onElementClick.bind(this));
    }

    onSelectionChanged(event: any) {
      const newSelectedId = event?.newSelection?.[0]?.id;
      this.updateQueryParams({ activityId: newSelectedId });
    }

    onElementHover(e: any) {
      e.preventDefault();
      e.stopPropagation();

      if (this.hoveredElement) {
        this.diagramOverlaysUtil?.handleShapeExit(this.hoveredElement);
      }
      this.diagramOverlaysUtil?.handleShapeEnter(e.element);
      this.hoveredElement = e.element;
    }

    onElementClick(event: any) {
      let element = event.element;
      if (element.type === 'label') {
        element = element.labelTarget;
      }

      // If it is the root, a sequence flow, or the currently filtered activity we need to un-filter
      if (
        element &&
        (element.type === 'bpmn:Process' ||
          element.type === 'bpmn:SequenceFlow' ||
          this.route.snapshot.queryParams.filteredActivityId === element.id)
      ) {
        this.updateQueryParams({ activityId: undefined, filteredActivityId: undefined });
      } else {
        this.updateQueryParams({ activityId: element.id, filteredActivityId: element.id });
      }
    }

    showIncidentTokensOnDiagram(): void {
      if (this.incidents && this.diagramRendered) {
        this.incidents.forEach((incident) => {
          this.diagramOverlaysUtil?.addIncidentTokenToDiagram(incident.failedActivityId, incident.totalIncidents);
        });
      }
    }

    highlightIncidents() {
      if (this.incidents) {
        this.incidents.forEach((incident) => {
          this.diagramOverlaysUtil?.canvas?.addMarker(incident.failedActivityId, 'incident');
        });
      }
    }

    clearIncidentHighlights() {
      this.incidents?.forEach((incident) => {
        this.diagramOverlaysUtil?.canvas?.removeMarker(incident.failedActivityId, ActivityMarkers.INCIDENT);
      });
    }

    updateJobDefinitionsOverlayOnDiagram(): void {
      if (this.jobDefinitions && this.diagramRendered) {
        this.jobDefinitions.forEach((jobDefinition) => {
          if (jobDefinition.activityId) {
            if (jobDefinition.suspended) {
              this.diagramOverlaysUtil?.addSuspendToDiagram(jobDefinition.activityId);
            } else {
              this.diagramOverlaysUtil?.removeSuspendFromDiagram(jobDefinition.activityId);
            }
          }
        });
      }
    }

    getMarkerType(ended: boolean, canceled: boolean): string {
      if (ended && canceled) return ActivityMarkers.CANCELED;
      else if (ended && !canceled) return ActivityMarkers.COMPLETED;
      else return ActivityMarkers.IN_PROGRESS;
    }

    removeAllMarkersOnActivity(activityId: string) {
      Object.values(ActivityMarkers).forEach((markerClass) => {
        this.diagramOverlaysUtil?.canvas?.removeMarker(activityId, markerClass);
      });
    }

    async centerElement(activityId: string): Promise<void> {
      if (!activityId) {
        console.warn('No activity ID provided to centerElement.');
        return;
      }

      const navigatedViewer = this.diagramComponent?.navigatedViewer as NavigatedViewer;
      const canvas: any = navigatedViewer.get('canvas');
      const elementRegistry: any = navigatedViewer.get('elementRegistry');

      const elementBounds = elementRegistry.get(activityId);
      if (!elementBounds) {
        console.warn(`Element with ID "${activityId}" not found.`);
        return;
      }

      const targetElementMid = {
        x: elementBounds.x + elementBounds.width / 2,
        y: elementBounds.y + elementBounds.height / 2,
      };

      const currentViewbox = canvas.viewbox();
      const targetViewbox = {
        x: targetElementMid.x - currentViewbox.width / 2,
        y: targetElementMid.y - currentViewbox.height / 2,
        width: currentViewbox.width,
        height: currentViewbox.height,
      };

      await DiagramAnimationUtil.animatePan(canvas, currentViewbox, targetViewbox, this.ANIMATION_DURATION);
      if (canvas.zoom() !== this.FOCUS_SHAPE_ZOOM_LEVEL) {
        delay(this.DELAY_BETWEEN_ANIMATIONS);
        await DiagramAnimationUtil.animateZoom(canvas, this.FOCUS_SHAPE_ZOOM_LEVEL, this.ANIMATION_DURATION);
      }
    }
  };
}

/**
 * This function adds modification functionality to an ItemDetailPage.
 *
 * @param Base
 * @constructor
 */
export function WithModifiableInstance<TBase extends new (...args: any[]) => AugmentedProcessDiagram>(Base: TBase) {
  return class extends Base {
    activityInstanceInfo?: CompleteActivityInstanceInfo;
    clickedActivityId?: string;
    commandStackService!: PimCommandStackService;
    contextMenuSub$?: Subscription;
    diagramUtils!: DiagramUtilsService;
    elementRef!: ElementRef;
    enableModificationTools = false;
    menuItemService!: ContextMenuItemService;

    public contextMenu?: ContextMenuComponent;

    constructor(...args: any[]) {
      super(...args);
    }

    initContextMenu() {
      this.diagramOverlaysUtil?.diagramEventBus?.on(
        'element.mouseup',
        this.EVENT_PRIORITY,
        this.onElementMouseUp.bind(this),
      );
      this.diagramOverlaysUtil?.diagramEventBus?.on(
        'element.mousedown',
        this.EVENT_PRIORITY,
        this.contextMenu?.close.bind(this.contextMenu),
      );

      this.diagramOverlaysUtil?.diagramEventBus?.on(
        'element.contextmenu',
        this.EVENT_PRIORITY,
        this.onContextMenu.bind(this),
      );

      if (!this.contextMenuSub$)
        this.contextMenuSub$ = this.contextMenu?.itemClickEvent.subscribe(this.onContextMenuItemClicked.bind(this));
    }

    onElementMouseUp(e: any) {
      if (e.element.id !== this.clickedActivityId) this.clearActivityHighlight(this.clickedActivityId ?? '');
      this.contextMenu?.close();
    }

    onContextMenu(event: any): void {
      event.preventDefault();
      event.stopPropagation();

      if (this.enableModificationTools && !this.diagramUtils.elementIsLabel(event.element)) this.showContextMenu(event);
    }

    onContextMenuItemClicked(e: ContextMenuClickEvent) {
      if (e.action === ContextMenuItemAction.ADD_TOKEN || e.action === ContextMenuItemAction.REMOVE_TOKEN) {
        this.commandStackService.add({
          type: e.action,
          target: e.target,
          processInstanceId: this.itemId,
        });
        this.diagramOverlaysUtil?.overlayTokenOnShape(e.action, e.target, this.diagramUtils.elementIsFlow(e.target));
      } else if (e.action === ContextMenuItemAction.REDO) {
        this.diagramOverlaysUtil?.overlayTokenOnShape(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          e.original!.action,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          e.original!.target,
          this.diagramUtils.elementIsFlow(e.target),
        );
      } else if (e.action === ContextMenuItemAction.UNDO) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.diagramOverlaysUtil?.removeAllTokenOverlays(e.original!.target.id);
      }
    }

    onClickOutsideDiagram() {
      this.contextMenu?.close();
    }

    override onDiagramRendered(rendered: boolean): void {
      super.onDiagramRendered(rendered);
      this.initContextMenu();
    }

    showContextMenu(event: any) {
      this.clearActivityHighlight(this.clickedActivityId ?? '');

      this.clickedActivityId = event.element.id;

      if (!this.diagramUtils.elementIsProcess(event.element)) this.highlightActivity(this.clickedActivityId ?? '');

      this.contextMenu
        ?.init({
          items: this.getMenuItems(event.element),
          target: event.element,
          targetIsActive: this.menuItemService.elementHasActiveInstance(event.element, this.activityInstanceInfo),
        })
        // Ensure the DOM has been updated before opening the context menu
        // This ensures that the context menu is the correct size and
        // Doesn't throw off positioning measurements
        .pipe(delay(0), take(1))
        .subscribe(() => {
          this.contextMenu?.open(event.originalEvent.clientX, event.originalEvent.clientY);
        });
    }

    getMenuItems(element: any): ContextMenuItemProperties[] {
      return this.menuItemService?.getProcessInstanceMenuItems(element);
    }
  };
}

/**
 * This function adds heatmap functionality to an ItemDetailPage.
 *
 * @param Base
 * @constructor
 */
export function WithHeatmap<TBase extends new (...args: any[]) => AugmentedProcessDiagram>(Base: TBase) {
  return class extends Base {
    readonly HEATMAP_POINT_SIZE = 25;
    readonly HEATMAP_OPACITY = 0.7;
    readonly HEATMAP_INTENSITY = 0.8;
    readonly HEATMAP_RENDER_DELAY = 100;

    heatmapInstance?: any;
    initialViewbox?: { x: number; y: number; scale: number; height: number; width: number }; // Used to perform heatmap transformations
    activeHeatmapData?: HeatmapData; // Used to store initial heatmap for re-rendering
    activeHeatmapParams?: HeatmapParams;
    debounceTimer?: NodeJS.Timeout;

    initHeatmap(canvas: ElementRef | undefined) {
      if (!canvas) {
        throw new Error('Could not initialize heatmap because canvas element is not yet defined.');
      }
      this.heatmapInstance = new Heatmap(canvas.nativeElement, {
        size: this.HEATMAP_POINT_SIZE,
        opacity: this.HEATMAP_OPACITY,
        intensity: this.HEATMAP_INTENSITY,
        min: 0,
        gradient: [
          { color: [0, 0, 255, 0], offset: 0 },
          { color: [0, 0, 255, 0.55], offset: 0.2 },
          { color: [0, 255, 0, 0.75], offset: 0.4 },
          { color: [255, 255, 0, 0.85], offset: 0.6 },
          { color: [255, 160, 0, 0.9], offset: 0.8 },
          { color: [255, 0, 0, 1.0], offset: 1.0 },
        ],
      });
      this.diagramOverlaysUtil?.diagramEventBus?.on('canvas.viewbox.changed', (event: any) => {
        if (this.heatmapInstance && this.initialViewbox) {
          this.updateHeatmapTransform(event.viewbox);
          this.heatmapInstance.render();
        }
      });
      this.diagramOverlaysUtil?.diagramEventBus?.on('canvas.resized', () => {
        if (this.heatmapInstance) {
          this.heatmapInstance.resize();
        }
        if (this.initialViewbox) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            this.createHeatmap(
              this.activeHeatmapData ?? { averageDuration: {}, count: {} },
              this.activeHeatmapParams ?? { active: false },
            );
          }, this.HEATMAP_RENDER_DELAY);
        }
      });
    }

    createHeatmap(data: HeatmapData, params: HeatmapParams) {
      if (this.diagramRendered && this.heatmapInstance) {
        this.heatmapInstance.clear();
        this.initialViewbox = this.diagramOverlaysUtil?.canvas.viewbox();
        this.activeHeatmapParams = params;
        this.heatmapInstance
          .setTranslate([0, 0])
          .setZoom(1)
          .setSize(this.HEATMAP_POINT_SIZE * (this.initialViewbox?.scale ?? 1));
        HeatmapUtil.ZOOM_LEVEL = this.initialViewbox?.scale ?? 1;

        timer(0)
          .pipe(take(1))
          .subscribe(() => {
            this.activeHeatmapData = data;
          }); // This crazy statement is needed to avoid the "ExpressionChangedAfterItHasBeenChecked" Angular Error

        HeatmapUtil.cleanupHeatmapTooltip(this.diagramComponent?.navigatedViewer as NavigatedViewer);
        this.heatmapInstance = HeatmapUtil.renderHeatmap(
          this.heatmapInstance,
          data,
          params,
          this.diagramComponent?.navigatedViewer as NavigatedViewer,
        );
      }
    }

    destroyHeatmap() {
      if (this.heatmapInstance) {
        this.initialViewbox = undefined;
        this.activeHeatmapParams = undefined;
        timer(0)
          .pipe(take(1))
          .subscribe(() => {
            this.activeHeatmapData = undefined;
          }); // This crazy statement is needed to avoid the "ExpressionChangedAfterItHasBeenChecked" Angular Error
        HeatmapUtil.cleanupHeatmapTooltip(this.diagramComponent?.navigatedViewer as NavigatedViewer);
      }
    }

    updateHeatmapTransform(newViewbox: any): void {
      if (!this.initialViewbox) {
        return;
      }

      const scaleRatio = this.initialViewbox.scale / newViewbox.scale;

      const initialCenterX = this.initialViewbox.x + this.initialViewbox.width / 2;
      const initialCenterY = this.initialViewbox.y + this.initialViewbox.height / 2;
      const currentCenterX = newViewbox.x + newViewbox.width / 2;
      const currentCenterY = newViewbox.y + newViewbox.height / 2;

      const translationX = (initialCenterX - currentCenterX) * this.initialViewbox.scale;
      const translationY = (initialCenterY - currentCenterY) * this.initialViewbox.scale;

      this.heatmapInstance
        .setTranslate([translationX, translationY])
        .setZoom(scaleRatio)
        .setSize((this.HEATMAP_POINT_SIZE * this.initialViewbox.scale) / scaleRatio);

      this.heatmapInstance.render();
    }
  };
}
