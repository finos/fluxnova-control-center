import { Component, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { DecisionDefinitionDiagram, DIAGRAM_TYPE, ProcessDefinitionDiagram } from '@fxn/types';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import { DiagramService } from '../../services/diagram.service';
import { SequenceFlow } from '../../detail-pages/diagram.mixin';
import { DiagramRendererService } from './services/diagram-renderer.service';
import { DiagramRenderer } from './diagram-renderer';

/**
 * This component can render basic BPMN and DMN diagrams by providing
 * it a diagram type and an ID to load.  Inherently handles switching
 * between diagrams.  Parent components can listen for the diagramRendered
 * event in order to perform actions that need to happen after the
 * diagram is displayed.
 */
@Component({
  selector: 'fluxnova-generic-diagram-viewer',
  templateUrl: `./generic-diagram-viewer.component.html`,
  styleUrls: ['./generic-diagram-viewer.component.scss'],
  imports: [],
  standalone: true,
})
export class GenericDiagramSectionViewComponent implements OnDestroy {
  protected readonly diagramService = inject(DiagramService);
  protected readonly diagramRendererService = inject(DiagramRendererService);

  protected _id = '';
  protected _diagramType: DIAGRAM_TYPE = DIAGRAM_TYPE.BPMN;
  protected renderer?: DiagramRenderer;
  protected getXMLSubscription?: Subscription;
  protected diagramFound = true;

  public isLoading = false;
  @Input() showSpinner = false;

  @Input()
  set id(id: string) {
    if (id && id !== this._id) {
      this._id = id;
      this.getDiagramXml();
    }
  }

  get id(): string {
    return this._id;
  }

  @Input()
  set diagramType(type: DIAGRAM_TYPE) {
    this._diagramType = type;
  }

  get diagramType(): DIAGRAM_TYPE {
    return this._diagramType;
  }

  get navigatedViewer(): NavigatedViewer | DmnJSNavigatedViewer | undefined {
    return this.renderer?.navigatedViewer;
  }

  get canZoom(): boolean {
    const type = this.renderer?.getDiagramType();
    return type === DIAGRAM_TYPE.BPMN || type === DIAGRAM_TYPE.DRD;
  }

  protected get supportingServices(): Observable<any>[] {
    return [];
  }

  @Output()
  diagramRendered = new EventEmitter<boolean>();
  @Output()
  sequenceFlows = new EventEmitter<SequenceFlow[]>();

  @ViewChild('diagramContainerDiv') diagramContainerDiv?: ElementRef;

  getDiagramXml() {
    this.isLoading = true;

    this.getXMLSubscription?.unsubscribe();
    this.getXMLSubscription = forkJoin([
      this.diagramService.getDiagram(this.id, this.diagramType),
      ...this.supportingServices,
    ]).subscribe({
      next: (params) => this.onDiagramXmlRetrieved(...params),
      error: this.onDiagramXmlRetrieveError.bind(this),
    });
  }

  getSequenceFlows(diagram: ProcessDefinitionDiagram | DecisionDefinitionDiagram) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(diagram.xml, 'text/xml');
    const sequenceArray: { sequenceId: string; sourceActivityId: string | null; targetActivityId: string | null }[] =
      [];
    const sequenceNodes = xml.getElementsByTagName('bpmn:sequenceFlow');

    Array.from(sequenceNodes).forEach((sequence) => {
      sequenceArray.push({
        sequenceId: sequence.id,
        sourceActivityId: sequence.getAttribute('sourceRef') as string,
        targetActivityId: sequence.getAttribute('targetRef') as string,
      });
    });
    return sequenceArray;
  }

  onDiagramXmlRetrieved(diagram: ProcessDefinitionDiagram | DecisionDefinitionDiagram, ...rest: any[]) {
    this.isLoading = false;
    this.sequenceFlows.emit(this.getSequenceFlows(diagram));

    try {
      if (this.renderer) {
        this.renderer.navigatedViewer.destroy();
      }
      this.renderDiagram(diagram, ...rest);
    } catch (e) {
      console.error(e);
      this.diagramFound = false;
      this.diagramRendered.emit(false);
    }
  }

  onDiagramXmlRetrieveError() {
    this.isLoading = false;
    this.diagramFound = false;
    this.diagramRendered.emit(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async renderDiagram(diagram: ProcessDefinitionDiagram | DecisionDefinitionDiagram, ...rest: any[]) {
    this.diagramRendered.emit(false);
    this.renderer = this.diagramRendererService.getDiagramRenderer(
      diagram.xml,
      this._diagramType,
      this.diagramContainerDiv?.nativeElement,
    );
    await this.diagramRendererService.renderDiagram(this.renderer);
    this.diagramFound = true;
    this.diagramRendered.emit(true);
  }

  ngOnDestroy() {
    this.getXMLSubscription?.unsubscribe();
    this.renderer?.navigatedViewer.destroy();
  }

  zoomDiagram(zoomAmount: number) {
    let viewer: any = this.navigatedViewer;
    if (this.diagramType === DIAGRAM_TYPE.DMN) {
      viewer = viewer.getActiveViewer();
    }
    const zoomScroll: any = viewer.get('zoomScroll');
    zoomScroll.stepZoom(zoomAmount);
  }

  recenterDiagramView(offsetPercentage?: { x: number; y: number }) {
    let viewer: any = this.navigatedViewer;
    if (this.diagramType === DIAGRAM_TYPE.DMN) {
      viewer = viewer.getActiveViewer();
    }
    const canvas: any = viewer.get('canvas');
    canvas.zoom('fit-viewport', 'auto');
    if (offsetPercentage) {
      const viewbox = canvas.viewbox();
      canvas.scroll({ dx: -viewbox.width * offsetPercentage.x, dy: -viewbox.height * offsetPercentage.y });
    }
  }

  notifyCanvasSizeChanged() {
    let viewer: any = this.navigatedViewer;
    if (this.diagramType === DIAGRAM_TYPE.DMN) {
      viewer = viewer.getActiveViewer();
    }
    const canvas: any = viewer.get('canvas', false);
    canvas?.resized();
  }
}
