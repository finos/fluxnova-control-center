import { inject, Injectable } from '@angular/core';
import { ThemeService } from '@fxn/common';
import { DIAGRAM_TYPE, ThemeName } from '@fxn/types';
import { DiagramRenderer } from '../diagram-renderer';
import { DiagramBpmnRenderer } from '../diagram-bpmn-renderer';
import { DiagramDmnRenderer } from '../diagram-dmn-renderer';
import { ViewerService } from './viewer.service';

@Injectable({ providedIn: 'root' })
export class DiagramRendererService {
  private themeService = inject(ThemeService);
  private viewerService = inject(ViewerService);

  public async openDiagramView(renderer: DiagramRenderer | null, viewId: string = '') {
    if (!renderer || !viewId || !renderer.open) {
      return;
    }

    renderer.open(viewId);
  }

  public async renderDiagram(renderer: DiagramRenderer | null, viewId: string = '') {
    if (!renderer) {
      return;
    }

    await renderer.render();
    renderer.reposition();
    await this.openDiagramView(renderer, viewId);
  }

  public getDiagramRenderer(
    diagramXml: string,
    diagramType: DIAGRAM_TYPE,
    element: HTMLElement,
    themeName?: ThemeName,
  ): DiagramRenderer {
    if (!diagramXml) {
      throw new Error('DiagramXml is not defined');
    }

    switch (diagramType) {
      case DIAGRAM_TYPE.DMN:
        return this.getDmnDiagramRenderer(diagramXml, element);
      case DIAGRAM_TYPE.BPMN:
      default:
        return this.getBPMNDiagramRenderer(diagramXml, element, themeName || 'default');
    }
  }

  public getBPMNDiagramRenderer(diagramXml: string, element: HTMLElement, themeName: ThemeName): DiagramBpmnRenderer {
    return new DiagramBpmnRenderer(
      diagramXml,
      this.viewerService.getNavigatedViewer(element),
      this.themeService.getBpmnColors(themeName),
    );
  }

  public getDmnDiagramRenderer(diagramXml: string, element: HTMLElement): DiagramDmnRenderer {
    return new DiagramDmnRenderer(diagramXml, this.viewerService.getDMNJSViewer(element));
  }
}
