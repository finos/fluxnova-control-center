import { AfterViewChecked, Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { of, take, timer } from 'rxjs';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { DecisionInstanceTabs } from '../../item-detail-tab-utils';
import { DecisionDiagramViewerComponent } from '../../../common/diagram/decision-diagram-viewer.component';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';

@Component({
  selector: 'fluxnova-decision-instance-details-page',
  templateUrl: '../../item-detail-page.component.html',
  styleUrls: ['../../item-detail-page.component.scss'],
  standalone: false,
})
export class DecisionInstanceDetailPageComponent
  extends ItemDetailPageComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  protected decisionInstanceService = inject(DecisionInstanceService);
  private toolbarService = inject(ToolbarService);

  @ViewChild(DecisionDiagramViewerComponent) diagramSection?: DecisionDiagramViewerComponent;

  override get itemId(): string {
    return this.route.snapshot.params.instanceId;
  }

  ngOnInit() {
    this.isLoading = true;
    this.subs$.add(
      this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
      this.decisionInstanceService.getInstance(this.itemId).subscribe({
        next: () => {
          this.isItemFound$ = of(true);
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        },
      }),
    );
    this.setUpTabs();
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    if (event.target === 'diagramTools') {
      switch (event.action) {
        case 'zoom':
          this.diagramSection?.zoomDiagram(event.value);
          break;
        case 'reset-view':
          this.diagramSection?.recenterDiagramView();
      }
    }
  }

  ngAfterViewChecked() {
    this.updateDiagramToolbar();
  }

  override initTabNames() {
    this.tabs = DecisionInstanceTabs;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  updateDiagramToolbar() {
    timer(0)
      .pipe(take(1))
      .subscribe(() => {
        this.includeDiagramToolbar = this.diagramSection?.canZoom ?? false;
      }); // This crazy statement is needed to avoid the "ExpressionChangedAfterItHasBeenChecked" Angular Error
  }

  @HostListener('window:resize', ['$event'])
  override onCanvasSizeChanged() {
    this.diagramSection?.notifyCanvasSizeChanged();
  }
}
