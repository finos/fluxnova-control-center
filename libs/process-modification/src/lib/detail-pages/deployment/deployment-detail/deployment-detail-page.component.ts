import { Component, HostListener, inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SIDE_DRAWER_CLOSED_WIDTH, SIDE_DRAWER_COLLAPSIBLE_WIDTH, SIDE_DRAWER_OPEN_WIDTH } from '@fxn/common';
import { delay, of, take, timer } from 'rxjs';
import { ButtonActions, DeploymentResource } from '@fxn/types';
import { SplitComponent } from 'angular-split';
import {
  DEFAULT_TOP_PANE_HEIGHT_PCT,
  GUTTER_SIZE,
  ItemDetailPageComponent,
  PanelState,
} from '../../item-detail-page.component';
import { DeploymentService } from '../../../services/deployment.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { DeploymentTabs, PimTab } from '../../item-detail-tab-utils';
import { FileViewComponent } from './file-viewer/file-view.component';

@Component({
  selector: 'fluxnova-deployment-details-page',
  templateUrl: './deployment-detail-page.component.html',
  styleUrls: ['../../item-detail-page.component.scss'],
  standalone: false,
})
export class DeploymentDetailsPageComponent extends ItemDetailPageComponent implements OnInit, OnDestroy {
  private ngZone = inject(NgZone);
  private toolbarService = inject(ToolbarService);
  deploymentService = inject(DeploymentService);
  document = inject(DOCUMENT);

  @ViewChild(FileViewComponent) fvc?: FileViewComponent;
  public selectedResource?: DeploymentResource;
  public includeDiagramToolbar = false;
  public hideBottomPanel = false;
  protected _sideNav?: HTMLElement | null;
  protected readonly DeploymentTabs = DeploymentTabs;
  private transitionEndListener = this.updateRightPanelXPos.bind(this);

  protected _split?: SplitComponent;

  @ViewChild('split') set split(splitter: SplitComponent) {
    this._split = splitter;

    // Watch the dragging progress of the splitter so that
    // we can update the size of the monaco editor accordingly
    this.subs$.add(
      this._split?.dragProgress$.subscribe((x) => {
        const sideNavWidth = this._sideNav?.getBoundingClientRect().width || SIDE_DRAWER_CLOSED_WIDTH;
        this.ngZone.run(() => (this.rightPanelXPosition = (x.sizes[0] as number) + sideNavWidth + GUTTER_SIZE));
      }),
    );
  }

  ngOnInit() {
    this.isLoading = true;
    this.initialPanelSize = {
      leftPaneWidth: 325,
      topPaneHeight: 50,
    };

    this.subs$.add(
      this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
      this.deploymentService.getDeploymentDetails(this.itemId).subscribe({
        next: () => {
          this.isItemFound$ = of(true);
          this.isLoading = false;
          this.updateQueryParams();
        },

        error: (error) => {
          console.log(error);
          this.isLoading = false;
        },
      }),
      // Delay(0) makes sure this executes after the toolbar has been created
      // and solves the ExpressionChangedAfterItHasBeenCheckedError
      this.deploymentService.selectedResource.pipe(delay(0)).subscribe((resource) => {
        this.selectedResource = resource;
        this.toolbar?.enable([ButtonActions.DELETE, ButtonActions.DOWNLOAD_RESOURCE]);

        const topPaneHeight =
          this.resourceUtilsService.isBPMN(this.selectedResource) || this.resourceUtilsService.isDMN(resource)
            ? 50
            : 100;
        this.initialPanelSize.topPaneHeight = topPaneHeight;

        if (this.fvc) this.fvc.resource = resource;

        // Set tabs dynamically based on the clicked resource
        this.setTabsBasedOnResource(resource);
        this.updateQueryParams();
      }),
    );

    this.setupSideNavWatchers();
  }

  /**
   * Watch the transition of the side nav opening and closing
   * so that we can adjust the size of the monaco editor accordingly.
   */
  setupSideNavWatchers() {
    this._sideNav = this.document.querySelector('[id="dashboard_side_color"]');
    this._sideNav?.addEventListener('transitionend', this.transitionEndListener);
    // Fix x position if navbar is already open
    if (this._sideNav?.offsetWidth === SIDE_DRAWER_OPEN_WIDTH) {
      this.rightPanelXPosition += SIDE_DRAWER_COLLAPSIBLE_WIDTH;
    }
  }

  updateRightPanelXPos(event: TransitionEvent) {
    if (event.target instanceof HTMLElement && event.target === this._sideNav) {
      const currentSideNavWidth = event.target?.offsetWidth;
      if (currentSideNavWidth === SIDE_DRAWER_OPEN_WIDTH) {
        this.rightPanelXPosition += SIDE_DRAWER_COLLAPSIBLE_WIDTH;
      } else {
        this.rightPanelXPosition -= SIDE_DRAWER_COLLAPSIBLE_WIDTH;
      }
    }
  }

  expandOrCollapsePanel(panelState: PanelState) {
    super.expandOrCollapsePanel(panelState);
    if (panelState === this.infoPanelState) {
      const sideNavWidth = this._sideNav?.offsetWidth || SIDE_DRAWER_CLOSED_WIDTH;
      if (panelState.getVisibility() === true) {
        this.rightPanelXPosition = panelState.initialSize + sideNavWidth + GUTTER_SIZE;
      } else {
        this.rightPanelXPosition = sideNavWidth + GUTTER_SIZE;
      }
    }
  }

  ngOnDestroy() {
    this.subs$.unsubscribe();
    this._sideNav?.removeEventListener('transitionend', this.transitionEndListener);
    super.ngOnDestroy();
  }

  setTabsBasedOnResource(resource: DeploymentResource) {
    if (!resource) {
      this.tabs = [];
      return;
    }

    let filteredTabs: PimTab[] = [];

    if (this.resourceUtilsService.isBPMN(resource)) {
      filteredTabs = [PimTab.Definitions];
    } else if (this.resourceUtilsService.isDMN(resource)) {
      filteredTabs = [PimTab.Definitions, PimTab.DecisionRequirementsDefinitions];
    }

    this.tabs = filteredTabs;
    this.activeTab = filteredTabs[0];
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    if (event.action === 'click') {
      switch (event.target) {
        case ButtonActions.DELETE:
          await this.confirmActionService.deleteDeployment([this.itemId], () => {
            this.router.navigate(['../'], { relativeTo: this.route });
          });
          break;
        case ButtonActions.DOWNLOAD_RESOURCE:
          if (this.selectedResource) {
            this.resourceUtilsService.downloadDeploymentResource(this.selectedResource);
          }
          break;
      }
    }

    if (event.target === 'diagramTools') {
      switch (event.action) {
        case 'zoom':
          this.fvc?.diagramSection?.zoomDiagram(event.value);
          break;
        case 'reset-view':
          this.fvc?.diagramSection?.recenterDiagramView();
      }
    }
  }

  updateQueryParams() {
    const queryParams = {
      tab: this.activeTab,
      resourceName: this.selectedResource?.name,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  onFileViewChanged() {
    timer(0)
      .pipe(take(1))
      .subscribe(() => {
        this.includeDiagramToolbar = this.fvc?.diagramSection?.canZoom ?? false;
        this.hideBottomPanel = !this.fvc?.showDiagram;
        if (this.hideBottomPanel === this.tabPanelState.getVisibility()) {
          // This handles the case where the diagram renders before the bottom pane is opened, which caused the diagram to be off center.
          // Re-centering the diagram with an added offset the size of the bottom pane (when it is open) fixes this issue.
          if (!this.hideBottomPanel) {
            const initialBottomPaneHeight = (100 - DEFAULT_TOP_PANE_HEIGHT_PCT) / 100;
            this.fvc?.diagramSection?.recenterDiagramView({ x: 0, y: initialBottomPaneHeight / 2 });
          }

          this.expandOrCollapsePanel(this.tabPanelState);
        }
      }); // This crazy statement is needed to avoid the "ExpressionChangedAfterItHasBeenChecked" Angular Error
  }

  @HostListener('window:resize', ['$event'])
  override onCanvasSizeChanged() {
    this.fvc?.diagramSection?.notifyCanvasSizeChanged();
  }
}
