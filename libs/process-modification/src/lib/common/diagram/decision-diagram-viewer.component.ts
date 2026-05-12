import { Component, inject } from '@angular/core';
import { DecisionDefinition, DecisionDefinitionDiagram, DIAGRAM_TYPE, ProcessDefinitionDiagram } from '@fxn/types';
import { Observable } from 'rxjs';
import { DecisionDefinitionService } from '../../services/decision-definition.service';
import { GenericDiagramSectionViewComponent } from './generic-diagram-viewer.component';

/**
 * This component is specific to diagrams displayed
 * in the decision pages, due to the nature of what
 * diagram or drd should be displayed based on the current page.
 */
@Component({
  selector: 'fluxnova-decision-diagram-viewer',
  templateUrl: `./generic-diagram-viewer.component.html`,
  styleUrls: ['./generic-diagram-viewer.component.scss'],
  imports: [],
  standalone: true,
})
export class DecisionDiagramViewerComponent extends GenericDiagramSectionViewComponent {
  private decisionDefinitionService = inject(DecisionDefinitionService);

  protected override _diagramType = DIAGRAM_TYPE.DMN;

  protected override get supportingServices(): Observable<any>[] {
    return [this.decisionDefinitionService.getDecisionDefinitionDetail(this.id)];
  }

  /**
   * Override the base functionality in order to autoselect the
   * correct table or drd.
   *
   * @param diagram
   * @param decisionDefinition
   */
  override async renderDiagram(
    diagram: ProcessDefinitionDiagram | DecisionDefinitionDiagram,
    decisionDefinition: DecisionDefinition,
  ) {
    const key = decisionDefinition.key || '';

    this.renderer = this.diagramRendererService.getDiagramRenderer(
      diagram.xml,
      this._diagramType,
      this.diagramContainerDiv?.nativeElement,
    );
    await this.diagramRendererService.renderDiagram(this.renderer, key);
    this.diagramRendered.emit(true);
  }
}
