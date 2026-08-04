import { Component, HostListener, inject, OnDestroy, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, Observable, of, Subscription, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { getUrlSegments, RouteData } from '@fxn/common';
import { ItemDetailQueryParams, ItemType } from '@fxn/types';
import { SplitGutterInteractionEvent } from 'angular-split';
import { ToolbarComponent } from '../common/toolbar/toolbar.component';
import { DeploymentResourceUtilsService } from '../services/deployment-resource-utils.service';
import { ConfirmActionService } from '../services/confirm-action.service';
import { ItemDetailPageCommunicationService } from './item-detail-page.communication.service';
import { PimTab } from './item-detail-tab-utils';

export const GUTTER_SIZE = 8;
export const DEFAULT_TOP_PANE_HEIGHT_PCT = 60;
export const DEFAULT_LEFT_PANE_WIDTH_PX = 320;

export interface PanelState {
  visible$: Observable<boolean>;
  size$: Observable<number>;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;
  getVisibility: () => boolean;
  setSize: (size: number) => void;
  getSize: () => number;
  autoCloseCutoff: number;
  initialSize: number;
}

@Component({
  selector: 'fluxnova-item-detail-page',
  templateUrl: './item-detail-page.component.html',
  styleUrls: ['./item-detail-page.component.scss'],
  standalone: false,
})
export class ItemDetailPageComponent implements OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  confirmActionService = inject(ConfirmActionService);
  resourceUtilsService = inject(DeploymentResourceUtilsService);
  eventBus = inject(ItemDetailPageCommunicationService);

  readonly gutterSize = GUTTER_SIZE;

  TabNames = PimTab;
  ItemType = ItemType;
  routeData = this.route.snapshot.data as RouteData;
  activeTab = '';
  isLoading = false;
  subs$ = new SubSink();
  itemIdSub$?: Subscription;
  queryParams$: Observable<ItemDetailQueryParams> = this.route.queryParams;
  itemId$: Observable<string> = this.route.params.pipe(
    map((x) => x.id),
    filter((id) => id),
  );
  // Only used by Decision Instance detail page
  subItemId$: Observable<string> = this.route.params.pipe(
    map((x) => x.instanceId),
    filter((id) => id),
  );
  includeDiagramToolbar = true;

  initialPanelSize: { leftPaneWidth?: number; topPaneHeight?: number } = {
    topPaneHeight: DEFAULT_TOP_PANE_HEIGHT_PCT,
    leftPaneWidth: DEFAULT_LEFT_PANE_WIDTH_PX,
  };
  tabs: PimTab[] = [];
  tabCounts$?: Observable<{ [tab: string]: number | undefined }> = of({});
  isItemFound$?: Observable<boolean>;
  counts: { [p: string]: number } = {};
  infoPanelState = this.createPanelState(this.initialPanelSize.leftPaneWidth || 0, 100);
  tabPanelState = this.createPanelState(100 - (this.initialPanelSize.topPaneHeight || 0), 8);
  diagramPanelState = this.createPanelState(this.initialPanelSize.topPaneHeight || 0, 8);

  public toolbar?: ToolbarComponent;
  @ViewChild(ToolbarComponent)
  set toolbarRef(toolbarRef: ToolbarComponent) {
    // Initializing the toolbar multiple times can cause problematic behavior, so we check if it is already set.
    if (toolbarRef && !this.toolbar) {
      toolbarRef.item = { type: this.routeData.itemType, id: this.itemId };
      this.toolbar = toolbarRef;
    }
  }

  //This is the width of everything left of the "rightPanel"
  @Output() public rightPanelXPosition = 392;

  get itemId(): string {
    return this.route.snapshot.params.id;
  }

  get itemType(): string {
    return this.routeData.itemType;
  }

  protected get tenantId(): string {
    return this.route.snapshot.params.tenant;
  }

  public ngOnDestroy(): void {
    this.itemIdSub$?.unsubscribe();
    this.subs$?.unsubscribe();
  }

  getInitialTabCountsObservable() {
    return of({});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getInitialTabCount(tab: PimTab): Observable<number | undefined> {
    return of(undefined);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUpdatedTabCountsObservable(tabAndFilter: { tab: string; filter: any }) {
    return of({});
  }

  handleTabFilterUpdate(tabAndFilter: { tab: string; filter: any }) {
    this.updateCountForTab(tabAndFilter);
  }

  // this is for deep linking. This way, the activityId in the queryParam is only updated if the filteredActivityId matches the activityId in the queryParams.
  // If they match, that means a filter was set/cleared. This prevents an activityId from getting cleared whenever handleTabFilterUpdate is called.
  alignActivityIds(tabAndFilter: { tab: string; filter: any }) {
    if (this.tabHasActivityFilter(this.activeTab as PimTab)) {
      const newFilteredActivityId = tabAndFilter.filter?.activityId || tabAndFilter.filter?.activityIdIn?.[0];
      this.updateQueryParams({
        ...(this.route.snapshot.queryParams.activityId === this.route.snapshot.queryParams.filteredActivityId && {
          activityId: newFilteredActivityId,
        }),
        filteredActivityId: newFilteredActivityId,
      });
    }
  }

  setUpTabs() {
    this.initTabNames();
    this.setInitialActiveTab(this.tabs);
    this.subs$.add(
      this.queryParams$.subscribe((queryParams) => {
        this.setActiveTab(queryParams.tab);
      }),
      this.eventBus.tabFilterUpdated$.subscribe((tabAndFilter) => {
        this.handleTabFilterUpdate(tabAndFilter);
      }),
      this.getInitialTabCountsObservable()
        .pipe(take(1))
        .subscribe((counts: any) => {
          this.counts = counts;
        }),
    );
  }

  updateCountForTab(tabAndFilter: { tab: string; filter: any }) {
    this.getUpdatedTabCountsObservable(tabAndFilter)
      .pipe(take(1))
      .subscribe((countsToUpdate) => {
        this.counts = {
          ...this.counts,
          ...countsToUpdate,
        };
      });
  }

  initTabNames() {}

  setInitialActiveTab(validTabs: PimTab[]) {
    this.setActiveTab(this.route.snapshot.queryParams.tab);
    if (!this.activeTab || !validTabs.find((t) => t === this.activeTab)) {
      this.activeTabsChanged(validTabs[0] as PimTab);
    }
  }

  setActiveTab(tab?: string) {
    if (tab && tab !== this.activeTab) {
      this.activeTab = tab;
    }
  }

  navigateToVersion(versionDefinitionId: string) {
    const { tenant, page } = getUrlSegments(this.router.url);
    this.router.navigate([tenant, page, `${versionDefinitionId}`], {
      replaceUrl: true,
    });
  }

  activeTabsChanged(tab: PimTab | string) {
    const oldTab = this.activeTab as PimTab;
    this.activeTab = tab as PimTab;
    const activityId = this.route.snapshot.queryParams?.activityId;
    const filteredActivityId = this.route.snapshot.queryParams?.filteredActivityId;
    this.updateQueryParams(
      {
        tab: this.activeTab,
        activityId,
        filteredActivityId,
      },
      'replace',
    );
    if (oldTab) {
      this.getInitialTabCount(oldTab)
        .pipe(take(1))
        .subscribe((count) => {
          if (count !== undefined) {
            this.counts[oldTab] = count;
          }
        });
    }
  }

  updateQueryParams(queryParams: any, handlingMethod: 'merge' | 'preserve' | 'replace' | '' = 'merge') {
    this.router.navigate([], {
      replaceUrl: true,
      queryParamsHandling: handlingMethod,
      queryParams,
    });
  }

  public consolidateActivityPseudoIds(activities: { [key: string]: any }) {
    const result = { ...activities };
    Object.keys(activities).forEach((activityId) => {
      if (activityId.toLowerCase().includes('#multiinstancebody')) {
        delete result[activityId]; // deleting the element with the pseudoId
      }
    });
    return result;
  }

  expandOrCollapsePanel(panelState: PanelState) {
    panelState.toggleVisibility();

    panelState.setSize(panelState.initialSize); // This gets rid of the saved size of the panel when we expand/collapse, we may want to get rid of this at some point

    if (panelState === this.tabPanelState) {
      this.diagramPanelState.setSize(100 - this.tabPanelState.getSize());
    }
  }

  handlePanelDragEnd(panelState: PanelState, event: SplitGutterInteractionEvent, sizeIndex: number) {
    if ((event.sizes[sizeIndex] as number) < panelState.autoCloseCutoff) {
      panelState.setVisibility(false);
      return;
    }

    panelState.setSize(event.sizes[sizeIndex] as number);
    panelState.setVisibility(true);

    this.onCanvasSizeChanged();
  }

  /**
   * Overridden in the children classes if they need to do something when the canvas size changes.
   * This could be by either adjusting the side/bottom panel size or adjusting the window size.
   */
  @HostListener('window:resize', ['$event'])
  onCanvasSizeChanged() {}

  toggleDiagramFullscreen() {
    if (this.infoPanelState.getVisibility() || this.tabPanelState.getVisibility()) {
      if (this.infoPanelState.getVisibility()) {
        this.expandOrCollapsePanel(this.infoPanelState);
      }
      if (this.tabPanelState.getVisibility()) {
        this.expandOrCollapsePanel(this.tabPanelState);
      }
    } else {
      this.expandOrCollapsePanel(this.infoPanelState);
      this.expandOrCollapsePanel(this.tabPanelState);
    }
  }

  createPanelState(initialSize: number, autoCloseCutoff: number, initialVisibility: boolean = true): PanelState {
    const visibleSubject = new BehaviorSubject(initialVisibility);
    const sizeSubject = new BehaviorSubject(initialSize);

    return {
      visible$: visibleSubject.asObservable(),
      size$: sizeSubject.asObservable(),
      toggleVisibility: () => visibleSubject.next(!visibleSubject.value),
      setVisibility: (visible: boolean) => visibleSubject.next(visible),
      getVisibility: () => visibleSubject.value,
      setSize: (size: number) => sizeSubject.next(size),
      getSize: () => sizeSubject.value,
      autoCloseCutoff: autoCloseCutoff,
      initialSize: initialSize,
    };
  }

  protected readonly PimTab = PimTab;

  tabHasActivityFilter(tab: PimTab): boolean {
    return tab !== PimTab.Variables && tab !== PimTab.History && tab !== PimTab.Instances;
  }
}
