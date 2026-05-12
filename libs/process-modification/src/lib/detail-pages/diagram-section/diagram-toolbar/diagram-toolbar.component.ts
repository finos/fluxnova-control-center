import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ButtonActions, ItemType } from '@fxn/types';
import { HeatmapParams } from 'visual-heatmap';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AnimationState } from '@fxn/common';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimCommandStackService } from '../pim-command-stack.service';

@Component({
  selector: 'fluxnova-diagram-toolbar',
  templateUrl: './diagram-toolbar.component.html',
  styleUrls: ['./diagram-toolbar.component.css'],
  standalone: false,
})
export class DiagramToolbarComponent implements OnInit, OnDestroy {
  private commandStack = inject(PimCommandStackService);
  private toolbarService = inject(ToolbarService);
  private eventBus = inject(ItemDetailPageCommunicationService);

  private _diagramType?: ItemType.ProcessDefinition | ItemType.ProcessInstance | ItemType.DecisionDefinition;
  private isEmptySub: Subscription | undefined;
  private stackAppliedSuccessfullySub: Subscription | undefined;
  private diagramFlowHighlightedSub: Subscription | undefined;
  private heatmapActiveSub: Subscription | undefined;
  private instanceStatisticsShownSub: Subscription | undefined;

  public isEditEnabled = true;
  public isStartEnabled = true;
  public isEditing = false;
  public hasChanges = false;
  public diagramFlowHighlighted = false;
  public instanceStatisticsShown = false;

  public heatmapState = new AnimationState();

  @Input()
  public itemId?: string;

  ngOnInit() {
    this.isEmptySub = this.commandStack.isEmpty$.subscribe((isEmpty) => {
      this.hasChanges = !isEmpty;
      this.isEditing = !isEmpty || !this.commandStack.isUndoEmpty;
      this.toolbarService.emitter.emit({ target: 'diagramTools', action: 'edit', value: this.isEditing });
    });
    this.stackAppliedSuccessfullySub = this.commandStack.wasStackAppliedSuccessfully$.subscribe((successful) => {
      if (successful) {
        this.isEditing = false;
        this.toolbarService.emitter.emit({ target: 'diagramTools', action: 'edit', value: this.isEditing });
      }
    });
    this.diagramFlowHighlightedSub = this.eventBus.diagramFlowHighlighted$.subscribe(
      (isHighlighted) => (this.diagramFlowHighlighted = isHighlighted),
    );
    this.instanceStatisticsShownSub = this.eventBus.instanceStatisticsShown$.subscribe(
      (isShown) => (this.instanceStatisticsShown = isShown),
    );
    this.heatmapActiveSub = this.eventBus.heatmapParams$.subscribe((params: HeatmapParams) => {
      this.heatmapState.isOpen = params.active;
    });
  }

  ngOnDestroy() {
    this.isEmptySub?.unsubscribe();
    this.stackAppliedSuccessfullySub?.unsubscribe();
    this.diagramFlowHighlightedSub?.unsubscribe();
  }

  onEdit() {
    if (this.isEditEnabled) this.isEditing = true;
    this.toolbarService.emitter.emit({ target: 'diagramTools', action: 'edit', value: this.isEditing });
  }

  onStartProcess() {
    this.toolbarService.emitter.emit({ target: ButtonActions.START_PROCESS, action: 'click' });
  }

  onEvaluateDecision() {
    this.toolbarService.emitter.emit({ target: ButtonActions.EVALUATE_DECISION, action: 'click' });
  }

  async onApplyChanges() {
    this.toolbarService.emitter.emit({ target: ButtonActions.APPLY_CHANGES, action: 'click' });
  }

  onCancel() {
    this.commandStack.clear();
  }

  onZoomDiagram(zoomStep: number, tooltip: NgbTooltip) {
    tooltip.close();
    this.toolbarService.emitter.emit({ target: 'diagramTools', action: 'zoom', value: zoomStep });
  }

  onRecenterDiagram(tooltip: NgbTooltip) {
    tooltip.close();
    this.toolbarService.emitter.emit({ target: 'diagramTools', action: 'reset-view' });
  }

  enable(btns: ButtonActions[]) {
    this.isStartEnabled = btns.some((id) => id === ButtonActions.START_PROCESS);
    this.isEditEnabled = btns.some((id) => id === ButtonActions.MOVE_TOKEN);
  }

  disable(btns: ButtonActions[]) {
    this.isStartEnabled = !btns.some((id) => id === ButtonActions.START_PROCESS);
    this.isEditEnabled = !btns.some((id) => id === ButtonActions.MOVE_TOKEN);
  }

  set diagramType(type: ItemType.ProcessInstance | ItemType.ProcessDefinition | ItemType.DecisionDefinition) {
    this._diagramType = type;
  }

  get diagramType(): ItemType.ProcessInstance | ItemType.ProcessDefinition | ItemType.DecisionDefinition | undefined {
    return this._diagramType;
  }

  onToggleDiagramColors(tooltip: NgbTooltip) {
    tooltip.close();
    this.eventBus.diagramFlowHighlighted(!this.diagramFlowHighlighted);
  }

  onToggleInstanceStatistics(tooltip: NgbTooltip) {
    tooltip.close();
    this.eventBus.instanceStatisticsShown(!this.instanceStatisticsShown);
  }

  onToggleHeatmap(tooltip: NgbTooltip) {
    tooltip.close();
    this.heatmapState.toggle();
  }

  preventFocus(event: MouseEvent) {
    event.preventDefault();
    (event.target as HTMLButtonElement).blur();
  }

  protected readonly ItemType = ItemType;
}
