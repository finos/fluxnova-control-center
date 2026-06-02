/* eslint-disable max-lines */
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { catchError, delay, map, switchMap, tap } from 'rxjs/operators';
import {
  ActivityInstanceHistory,
  ButtonActions,
  Job,
  MAX_RESULT_COUNT,
  MAX_TOTAL_ACT_HIST_ITEMS,
  ProcessDefinition,
  ProcessDefinitionStatistic,
} from '@fxn/types';
import { groupBy, omitBy } from 'lodash-es';
import { pageSizeMax } from '@fxn/grid';
import { FilterModel } from 'ag-grid-community';
import moment from 'moment';
import { HeatmapData } from 'visual-heatmap';
import { acceptedDateFormats, ToastService } from '@fxn/common';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { PimTab, ProcessDefinitionTabs } from '../../item-detail-tab-utils';
import { ActivityIncident, ActivityMarkers, WithAugmentedProcessDiagram, WithHeatmap } from '../../diagram.mixin';
import { GenericDiagramSectionViewComponent } from '../../../common/diagram/generic-diagram-viewer.component';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { IncidentService } from '../../../services/incident.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { JobService } from '../../../services/job.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { DATA_RELOAD_DELAY } from '../../../common/app-constants';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

const COUNTS_DEFAULT: { [p: string]: number } = {
  [PimTab.Instances]: 0,
  [PimTab.Incidents]: 0,
  [PimTab.JobDefinitions]: 0,
  [PimTab.CalledProcessDefinitions]: 0,
  [PimTab.DecisionInstances]: 0,
};

@Component({
  selector: 'fluxnova-process-definition-detail-page',
  templateUrl: './process-definition-detail-page.component.html',
  styleUrls: ['../../item-detail-page.component.scss'],
  standalone: false,
})
export class ProcessDefinitionDetailPageComponent
  extends WithHeatmap(WithAugmentedProcessDiagram(ItemDetailPageComponent))
  implements OnInit, OnDestroy
{
  processDefinitionService = inject(ProcessDefinitionService);
  private incidentsService = inject(IncidentService);
  private instancesService = inject(ProcessInstanceService);
  private jobsService = inject(JobService);
  private decisionInstanceService = inject(DecisionInstanceService);
  private toolbarService = inject(ToolbarService);
  private toastService = inject(ToastService);

  statistics?: ProcessDefinitionStatistic[];
  activityInstanceHistory?: ActivityInstanceHistory[];
  heatmapHistory?: ActivityInstanceHistory[];
  heatmapHistoryLoading = false;
  processDefinition?: ProcessDefinition;
  private showInstanceStatistics = false;

  @ViewChild(GenericDiagramSectionViewComponent) override diagramComponent?: GenericDiagramSectionViewComponent;
  @ViewChild('heatmapCanvas') heatmapCanvas?: ElementRef;

  ngOnInit() {
    this.isItemFound$ = of(true);
    this.counts = COUNTS_DEFAULT;

    this.itemIdSub$ = this.itemId$.subscribe((id) => {
      this.subs$.unsubscribe();
      this.subs$.add(
        this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
        this.loadProcessDefinitionDetailData(id),
        this.queryParams$.subscribe((queryParams) => {
          this.selectedActivityId = queryParams.activityId;
          this.highlightActivity(this.selectedActivityId);
          this.diagramOverlaysUtil?.updateDiagramOpacity(queryParams.filteredActivityId);
          if (this.filteredActivityId !== queryParams.filteredActivityId) {
            this.updateTabCountsForFilteredActivity(queryParams.filteredActivityId);
            this.filteredActivityId = queryParams.filteredActivityId;
          }
        }),
        this.eventBus.reloadNeeded$.subscribe((reloadNeeded) => {
          if (reloadNeeded) {
            this.loadProcessDefinitionDetailData(this.itemId);
          }
        }),
        this.eventBus.diagramRendered$.subscribe((rendered) => {
          if (rendered && !this.heatmapInstance) {
            this.initHeatmap(this.heatmapCanvas);
          } else if (!rendered && this.heatmapInstance) {
            // This should only happen if angular reuses the component instead of destroying it
            this.eventBus.heatmapParams({ active: false });
            delete this.heatmapInstance;
            this.heatmapCanvas?.nativeElement.querySelector('canvas').remove();
          }
        }),
        // The delay here prevents ExpressionChangedAfterItHasBeenCheckedError
        this.eventBus.heatmapParams$
          .pipe(
            delay(0),
            switchMap((params) => {
              if (!params.active) {
                this.heatmapHistoryLoading = false;
                this.destroyHeatmap();
                return EMPTY;
              }

              this.heatmapHistoryLoading = true;
              return this.processDefinitionService
                .getActivityInstanceHistory(
                  this.itemId,
                  false,
                  this.convertTimelineToFilter(params.timeline ?? ''),
                  'startTime',
                  'desc',
                )
                .pipe(
                  tap((history) => {
                    this.heatmapHistoryLoading = false;
                    this.heatmapHistory = history;

                    if (this.heatmapHistory.length >= MAX_TOTAL_ACT_HIST_ITEMS)
                      this.toastService.info(
                        `Maximum (${MAX_TOTAL_ACT_HIST_ITEMS}) activity instance history items have been retrieved. The heatmap will only reflect the most recent ${MAX_TOTAL_ACT_HIST_ITEMS} items.`,
                        { autoHide: false },
                      );

                    this.createHeatmap(this.getStructuredHeatmapData(), params);
                  }),
                  catchError(() => {
                    this.heatmapHistoryLoading = false;
                    return EMPTY;
                  }),
                );
            }),
          )
          .subscribe(),
        this.eventBus.instanceStatisticsShown$.subscribe((isShown) => {
          this.clearDiagram();
          this.showInstanceStatistics = isShown;
          this.updateDiagram();
        }),
        this.eventBus.rowClickedWithActivity$.subscribe((activityId: string) => {
          this.centerElement(activityId);
        }),
      );

      this.setUpTabs();
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.eventBus.reset();
  }

  override initTabNames() {
    this.tabs = ProcessDefinitionTabs;
  }

  updateTabCountsForFilteredActivity(filteredActivityId?: string) {
    for (const tab of [
      PimTab.Incidents,
      PimTab.JobDefinitions,
      PimTab.CalledProcessDefinitions,
      PimTab.DecisionInstances,
    ]) {
      if (tab !== this.activeTab) {
        let filter: any = { processDefinitionId: this.itemId };
        if (tab === PimTab.Incidents) {
          filter = { ...filter, open: true };
        }
        if (filteredActivityId) {
          filter =
            tab === PimTab.DecisionInstances || tab === PimTab.JobDefinitions
              ? { ...filter, activityIdIn: [filteredActivityId] }
              : { ...filter, activityId: filteredActivityId };
        }
        this.updateCountForTab({ tab, filter: filter });
      }
    }
  }

  override getInitialTabCount(tab: PimTab): Observable<number> {
    switch (tab) {
      case PimTab.Incidents:
        return this.incidentsService.getIncidentCountByFilter({
          processDefinitionId: this.itemId,
          open: true,
          activityId: this.filteredActivityId,
        });
      case PimTab.Instances:
        return this.instancesService.getProcessInstanceHistoryCountByFilter({
          processDefinitionId: this.itemId,
          unfinished: true,
        });
      case PimTab.JobDefinitions:
        return this.jobsService.getJobDefinitionsCountByFilter({
          processDefinitionId: this.itemId,
          ...(this.filteredActivityId && { activityIdIn: [this.filteredActivityId] }),
        });
      case PimTab.CalledProcessDefinitions:
        return this.processDefinitionService
          .getCalledProcessDefinitions(
            new PaginatedDataRequest(
              { processDefinitionId: this.itemId, unfinished: true, activityId: this.filteredActivityId },
              pageSizeMax,
            ),
          )
          .pipe(map((result) => result.length));
      case PimTab.DecisionInstances:
        return this.decisionInstanceService.getInstancesCount({
          processDefinitionId: this.itemId,
          ...(this.filteredActivityId && { activityIdIn: [this.filteredActivityId] }),
        });
      default:
        // This prevents an error in the console when navigating to the Def Details Page
        // for the first time, since something is calling this with an empty string.
        // TODO: Fix whatever is calling this with an empty string.
        if (tab.toString() !== '') console.error(`No getInitialTabCount implementation for tab ${tab}`);
        return of(0);
    }
  }

  override getInitialTabCountsObservable() {
    return forkJoin(
      [
        PimTab.Incidents,
        PimTab.Instances,
        PimTab.JobDefinitions,
        PimTab.CalledProcessDefinitions,
        PimTab.DecisionInstances,
      ].map((pimTab) => this.getInitialTabCount(pimTab)),
    ).pipe(
      map(([incidents, instances, jobs, calledPDefs, decisions]) => ({
        [PimTab.Incidents]: incidents,
        [PimTab.Instances]: instances,
        [PimTab.JobDefinitions]: jobs,
        [PimTab.CalledProcessDefinitions]: calledPDefs,
        [PimTab.DecisionInstances]: decisions,
      })),
    );
  }

  override getUpdatedTabCountsObservable(tabAndFilter: { tab: string; filter: any }) {
    let serviceObservable: Observable<number> | undefined;

    switch (tabAndFilter.tab) {
      case PimTab.Instances:
        serviceObservable = this.instancesService.getProcessInstanceHistoryCountByFilter(tabAndFilter.filter);
        break;
      case PimTab.DecisionInstances:
        serviceObservable = this.decisionInstanceService.getInstancesCount(tabAndFilter.filter);
        break;
      case PimTab.Incidents:
        serviceObservable = this.incidentsService.getIncidentCountByFilter(tabAndFilter.filter);
        break;
      case PimTab.JobDefinitions:
        serviceObservable = this.jobsService.getJobDefinitionsCountByFilter(tabAndFilter.filter);
        break;
      case PimTab.CalledProcessDefinitions:
        serviceObservable = this.processDefinitionService
          .getCalledProcessDefinitions(new PaginatedDataRequest(tabAndFilter.filter, pageSizeMax))
          .pipe(map((list) => list.length));
        break;
    }

    return !!serviceObservable && !!tabAndFilter.tab
      ? serviceObservable.pipe(map((count) => ({ [tabAndFilter.tab]: count })))
      : of({});
  }

  override markupDiagram() {
    super.markupDiagram();
    this.addInProgressTokensToDiagram(this.activityInstanceHistory);
    this.highlightIncidents();
  }

  loadProcessDefinitionDetailData(processDefinitionId: string) {
    return forkJoin([
      this.processDefinitionService.getProcessDefinitionsByFilter(new PaginatedDataRequest({ processDefinitionId }, 1)),
      this.processDefinitionService.getStatistics(processDefinitionId),
      this.processDefinitionService
        .getActivityInstanceHistory(processDefinitionId, true, undefined, 'startTime', 'desc')
        .pipe(
          catchError(() => {
            this.toastService.error(
              'Problem loading activity instance history for the process definition. Tokens will not be displayed on the diagram.',
            );
            return of([]);
          }),
        ),
      this.jobsService.getJobDefinitionsByFilter(new PaginatedDataRequest({ processDefinitionId }, MAX_RESULT_COUNT)),
    ])
      .pipe(delay(DATA_RELOAD_DELAY))
      .subscribe({
        next: (params) => this.onDetailsLoaded(...params),
        error: this.onDetailsLoadFailed.bind(this),
      });
  }

  onDetailsLoaded(
    processDefinitions: ProcessDefinition[],
    stats: ProcessDefinitionStatistic[],
    history: ActivityInstanceHistory[],
    jobDefinitions: Job[],
  ) {
    this.clearDiagram();

    if (processDefinitions?.length) {
      this.toolbar?.updateButtonStates(processDefinitions[0]);
      this.processDefinition = processDefinitions[0];
    }
    this.statistics = stats;
    this.activityInstanceHistory = history;
    this.incidents = this.convertStatisticsToIncidents(stats || []) as ActivityIncident[];
    this.jobDefinitions = jobDefinitions;

    if (this.activityInstanceHistory.length >= MAX_TOTAL_ACT_HIST_ITEMS)
      this.toastService.info(
        `Maximum (${MAX_TOTAL_ACT_HIST_ITEMS}) activity instance history items have been retrieved. The tokens on the diagram only reflect the most recent ${MAX_TOTAL_ACT_HIST_ITEMS} items.`,
        { autoHide: false },
      );

    this.updateDiagram();
  }

  onDetailsLoadFailed() {
    this.isItemFound$ = of(false);
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    if (event.action === 'click') {
      switch (event.target) {
        case ButtonActions.ACTIVATE:
          await this.confirmActionService.activateOrSuspendDefinition([this.itemId], 'Activate', () => {
            this.eventBus.reloadNeeded();
          });
          break;
        case ButtonActions.SUSPEND:
          await this.confirmActionService.activateOrSuspendDefinition([this.itemId], 'Suspend', () => {
            this.eventBus.reloadNeeded();
          });
          break;
        case ButtonActions.DELETE:
          await this.confirmActionService.deleteDefinition([this.itemId], () => {
            this.router.navigate(['../'], { relativeTo: this.route });
          });
          break;
        case ButtonActions.START_PROCESS:
          await this.confirmActionService.startProcess(this.itemId, () => {
            this.eventBus.reloadNeeded();
          });
          break;
        case ButtonActions.DOWNLOAD_RESOURCE:
          await this.resourceUtilsService.downloadDiagramResource(
            this.processDefinition?.id ?? '',
            this.processDefinition?.key ?? '',
          );
      }
    }

    if (event.target === 'diagramTools') {
      switch (event.action) {
        case 'zoom':
          this.diagramComponent?.zoomDiagram(event.value);
          break;
        case 'reset-view':
          this.diagramComponent?.recenterDiagramView();
      }
    }
  }

  /**
   * Returns an array of incidents.
   * Will be empty if any no activity has at least 1 incident
   *
   * @param statistics
   * @protected
   */
  public convertStatisticsToIncidents(statistics: ProcessDefinitionStatistic[]) {
    return Object.values(
      omitBy(
        statistics.map((stat) => ({
          failedActivityId: stat.id,
          totalIncidents: stat.incidents
            ?.map((incident) => incident.incidentCount)
            .reduce((partialSum, a) => partialSum + a, 0),
        })),
        (incident) => incident.totalIncidents === 0,
      ),
    );
  }

  addInProgressTokensToDiagram(history?: ActivityInstanceHistory[]) {
    const groupedHistory = this.consolidateActivityPseudoIds(groupBy(history, 'activityId'));
    Object.keys(groupedHistory).forEach((key) => {
      let inProgressTokenCount = 0;
      groupedHistory[key].forEach((historyItem1: ActivityInstanceHistory) => {
        const type = this.getMarkerType(!!historyItem1.endTime, historyItem1.canceled || false);
        if (type === ActivityMarkers.IN_PROGRESS) {
          inProgressTokenCount += 1;
        }
      });
      if (inProgressTokenCount > 0) {
        this.diagramOverlaysUtil?.addTokenToDiagram(key, inProgressTokenCount, 'active-token');
      }
    });
  }

  clearTokens() {
    Object.keys(this.consolidateActivityPseudoIds(groupBy(this.activityInstanceHistory, 'activityId'))).forEach(
      (key) => {
        this.diagramOverlaysUtil?.clearToken(key);
      },
    );
    this.incidents?.forEach((incident) => {
      this.diagramOverlaysUtil?.clearToken(incident.failedActivityId);
    });
  }

  clearDiagram() {
    this.clearTokens();
    this.clearIncidentHighlights();
  }

  updateDiagram() {
    if (this.diagramRendered) {
      if (this.showInstanceStatistics) {
        this.markupDiagram();
      }
      this.updateJobDefinitionsOverlayOnDiagram();
    }
  }

  override handleTabFilterUpdate(tabAndFilter: { tab: string; filter: FilterModel }) {
    this.alignActivityIds(tabAndFilter);
    super.handleTabFilterUpdate(tabAndFilter);
  }

  onJobDefSuspensionChanged(event: any) {
    event.activityIds.forEach((activityId: string) => {
      const jobDefinition = this.jobDefinitions?.find((job) => job.activityId === activityId);
      if (jobDefinition) {
        jobDefinition.suspended = event.suspended;
      }
      if (event.suspended) {
        this.diagramOverlaysUtil?.addSuspendToDiagram(activityId);
      } else {
        this.diagramOverlaysUtil?.removeSuspendFromDiagram(activityId);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  override onCanvasSizeChanged() {
    this.diagramComponent?.notifyCanvasSizeChanged();
  }

  convertTimelineToFilter(timeline: string): string {
    let startTime: moment.Moment;

    switch (timeline) {
      case 'pastDay':
        startTime = moment().subtract(1, 'day').startOf('day');
        break;
      case 'pastWeek':
        startTime = moment().subtract(1, 'week').startOf('day');
        break;
      case 'pastMonth':
        startTime = moment().subtract(1, 'month').startOf('day');
        break;
      case 'pastQuarter':
        startTime = moment().subtract(3, 'months').startOf('day');
        break;
      case 'pastYear':
        startTime = moment().subtract(1, 'year').startOf('day');
        break;
      default:
        startTime = moment().subtract(1, 'month').startOf('day');
        break;
    }

    return startTime.format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT);
  }

  getStructuredHeatmapData(): HeatmapData {
    const data: HeatmapData = { averageDuration: {}, count: {} };

    if (this.heatmapHistory && this.heatmapHistory.length > 0) {
      const durationTotals: { [activityId: string]: number } = {};
      const counts: { [activityId: string]: number } = {};
      this.heatmapHistory.forEach((instance) => {
        if (!instance.activityId) return;
        let duration = 0;
        if (instance.startTime) {
          const endTime = new Date(instance.endTime ?? Date.now());
          const startTime = new Date(instance.startTime);
          duration = endTime.getTime() - startTime.getTime();
        }

        durationTotals[instance.activityId] = (durationTotals[instance.activityId] ?? 0) + duration;
        counts[instance.activityId] = (counts[instance.activityId] ?? 0) + 1;
      });
      Object.keys(durationTotals).forEach((activityId) => {
        if (counts[activityId] > 0) {
          data.averageDuration[activityId] = durationTotals[activityId] / counts[activityId];
        }
      });
      data.count = counts;
    }
    return data;
  }

  get showNoHistoryOverlay(): boolean {
    const data = this.activeHeatmapData;
    if (!data) {
      return false;
    }

    const hasAvgDuration = !!data.averageDuration && Object.keys(data.averageDuration).length > 0;
    const hasCount = !!data.count && Object.keys(data.count).length > 0;

    return !hasAvgDuration && !hasCount;
  }

  onDiagramSectionClick(): void {
    if (this.heatmapInstance && this.showNoHistoryOverlay) {
      this.eventBus.heatmapParams({ active: false });
    }
  }
}
