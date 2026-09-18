import { AfterViewInit, Component, inject, Input } from '@angular/core';
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
export class DecisionDiagramViewerComponent extends GenericDiagramSectionViewComponent implements AfterViewInit {
  private decisionDefinitionService = inject(DecisionDefinitionService);

  protected override _diagramType = DIAGRAM_TYPE.DMN;
  private _ruleIdsToHighlight: string[] = [];
  private _highlightedRows: HTMLElement[] = [];

  @Input()
  set ruleIdsToHighlight(ruleIds: string[]) {
    this._ruleIdsToHighlight = ruleIds ?? [];
  }

  ngAfterViewInit() {
    this.handleRowHighlights();
  }

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
    await this.handleRenderDiagram(diagram, decisionDefinition);
    this.handleRowHighlights();
    this.diagramRendered.emit(true);
  }

  private async handleRenderDiagram(
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
  }

  private handleRowHighlights() {
    const nativeElement: HTMLElement = this.diagramContainerDiv?.nativeElement;

    if (!nativeElement) {
      return;
    }

    this._highlightedRows.forEach((row) => row.classList.remove('row-highlighted'));
    this._highlightedRows = [];

    this._ruleIdsToHighlight.forEach((ruleId) => {
      const row = this.getRowElementToHighlight(ruleId);

      if (row) {
        row.classList.add('row-highlighted');
        this._highlightedRows.push(row);
      }
    });
  }

  private getRowElementToHighlight(ruleIdToHighlight: string) {
    const nativeElement: HTMLElement = this.diagramContainerDiv?.nativeElement;
    const cellWithId = nativeElement.querySelector<HTMLElement>(`[data-row-id="${ruleIdToHighlight}"]`);

    return cellWithId?.parentElement;
  }
}
