/* eslint-disable max-lines */
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, Observable, of, Subscription, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { groupBy, map as lodashMap } from 'lodash-es';
import {
  ActivityInstance,
  ActivityInstanceHistory,
  ButtonActions,
  ProcessInstance,
  ProcessInstanceStatesMap,
  TransitionInstance,
} from '@fxn/types';
import { FilterModel } from 'ag-grid-community';
import { MODAL_DEFAULTS } from '@fxn/common';
import moment from 'moment';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { FinishedProcessInstanceTabs, PimTab, ProcessInstanceTabs } from '../../item-detail-tab-utils';
import {
  ActivityIncident,
  ActivityMarkers,
  SequenceFlow,
  WithAugmentedProcessDiagram,
  WithModifiableInstance,
} from '../../diagram.mixin';
import { GenericDiagramSectionViewComponent } from '../../../common/diagram/generic-diagram-viewer.component';
import { ContextMenuComponent } from '../../diagram-section/context-menu/context-menu.component';
import { DiagramUtilsService } from '../../../common/diagram/services';
import { ContextMenuItemService } from '../../diagram-section/context-menu/context-menu-item.service';
import { PimCommandStackService } from '../../diagram-section/pim-command-stack.service';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { IncidentService } from '../../../services/incident.service';
import { CalledProcessInstancesService } from '../../../services/called-process-instances.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { VariableService } from '../../../services/variable.service';
import { JobService } from '../../../services/job.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ApplyChangesModalService } from '../../diagram-section/apply-changes-modal/apply-changes-modal-service';
import { UserTaskService } from '../../../services/user-task.service';

const COUNTS_DEFAULT: { [p: string]: number } = {
  [PimTab.Variables]: 0,
  [PimTab.DecisionInstances]: 0,
  [PimTab.Incidents]: 0,
  [PimTab.CalledProcessInstances]: 0,
  [PimTab.History]: 0,
  [PimTab.JobDefinitions]: 0,
  [PimTab.Jobs]: 0,
  [PimTab.UserTasks]: 0,
};
@Component({
  selector: 'fluxnova-process-instance-detail-page',
  templateUrl: './process-instance-detail-page.component.html',
  styleUrls: ['./process-instance-detail-page.component.scss'],
  standalone: false,
})
export class ProcessInstanceDetailPageComponent
  extends WithModifiableInstance(WithAugmentedProcessDiagram(ItemDetailPageComponent))
  implements OnInit, OnDestroy
{
  private jobsService = inject(JobService);
  private commandStack = inject(PimCommandStackService);
  private applyChangesModalService = inject(ApplyChangesModalService);
  protected toolbarService = inject(ToolbarService);
  protected decisionInstanceService = inject(DecisionInstanceService);
  protected incidentsService = inject(IncidentService);
  protected calledProcessInstanceService = inject(CalledProcessInstancesService);
  protected instanceService = inject(ProcessInstanceService);
  protected variableService = inject(VariableService);
  protected userTaskService = inject(UserTaskService);

  diagramUtils = inject(DiagramUtilsService);
  menuItemService = inject(ContextMenuItemService);
  commandStackService = inject(PimCommandStackService);
  elementRef = inject(ElementRef);
  isEditing = false;
  isSaving = false;
  processInstance?: ProcessInstance;
  history?: ActivityInstanceHistory[];
  instanceSub?: Subscription;
  activeActivityInstance?: ActivityInstance;
  activityInstancesSub?: Subscription;
  userTaskSub?: Subscription;
  public sequenceFlows: SequenceFlow[] = [];
  public diagramFlowHighlighted = false;

  get isUnfinished(): boolean {
    return (
      this.processInstance?.state !== ProcessInstanceStatesMap.EXTERNALLY_TERMINATED.value &&
      this.processInstance?.state !== ProcessInstanceStatesMap.INTERNALLY_TERMINATED.value &&
      this.processInstance?.state !== ProcessInstanceStatesMap.COMPLETED.value
    );
  }

  @ViewChild(GenericDiagramSectionViewComponent) override diagramComponent?: GenericDiagramSectionViewComponent;
  @ViewChild(ContextMenuComponent) declare contextMenu: ContextMenuComponent;

  get isUnfinishedInstance() {
    const hasNoInstance = !this.processInstance;
    const isSuspended = this.processInstance?.state === ProcessInstanceStatesMap.SUSPENDED.value;
    const isActive = this.processInstance?.state === ProcessInstanceStatesMap.ACTIVE.value;

    return hasNoInstance || isSuspended || isActive;
  }

  ngOnInit() {
    this.isItemFound$ = of(true);
    this.counts = COUNTS_DEFAULT;

    this.itemIdSub$ = this.itemId$.subscribe((id) => {
      this.subs$.unsubscribe();
      this.subs$.add(
        this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
        this.commandStackService.isEmpty$.subscribe((isStackEmpty) => {
          if (isStackEmpty) this.diagramOverlaysUtil?.removeAllTokenOverlays();
        }),
        this.commandStackService.isApplyingChanges$.subscribe((isApplyingChanges) => {
          this.isSaving = isApplyingChanges;
        }),
        this.commandStackService.wasStackAppliedSuccessfully$.subscribe((wasAppliedSuccessfully) => {
          if (wasAppliedSuccessfully) {
            this.eventBus.reloadNeeded();
            this.colorDiagram();
          }
        }),
        this.eventBus.reloadNeeded$.subscribe((reloadNeeded) => {
          if (reloadNeeded) this.loadProcessInstanceDetailData(this.itemId);
        }),
        this.queryParams$.subscribe((queryParams) => {
          this.selectedActivityId = queryParams.activityId;
          this.highlightActivity(this.selectedActivityId);
          this.diagramOverlaysUtil?.updateDiagramOpacity(queryParams.filteredActivityId);
          if (this.filteredActivityId !== queryParams.filteredActivityId) {
            this.updateTabCountsForFilteredActivity(queryParams.filteredActivityId);
            this.filteredActivityId = queryParams.filteredActivityId;
          }
        }),
        this.eventBus.diagramFlowHighlighted$.subscribe((isHighlighted) => {
          this.diagramFlowHighlighted = isHighlighted;
          if (this.diagramRendered) {
            this.colorDiagram();
          }
        }),
        this.eventBus.rowClickedWithActivity$.subscribe((activityId: string) => {
          this.centerElement(activityId);
        }),
      );
      this.instanceService
        .getProcessInstance(id)
        .pipe(take(1))
        .subscribe((processInstance) => {
          this.processInstance = processInstance;
          this.setUpTabs();
          if (this.diagramComponent) this.diagramComponent.id = this.processInstance?.processDefinitionId || '';
          this.enableModificationTools = this.isUnfinished;

          this.toolbar?.updateButtonStates(this.processInstance);
        });

      this.loadProcessInstanceDetailData(id);
    });
  }

  override initTabNames() {
    this.tabs = this.isUnfinishedInstance ? ProcessInstanceTabs : FinishedProcessInstanceTabs;
  }

  updateTabCountsForFilteredActivity(filteredActivityId?: string) {
    for (const tab of [
      PimTab.Incidents,
      PimTab.CalledProcessInstances,
      PimTab.Jobs,
      PimTab.DecisionInstances,
      PimTab.UserTasks,
    ]) {
      if (tab !== this.activeTab) {
        let filter: any = { processInstanceId: this.itemId };
        if (tab === PimTab.Incidents) {
          filter = { ...filter, open: true };
        }
        if (filteredActivityId) {
          switch (tab) {
            case PimTab.DecisionInstances:
              filter = { ...filter, activityIdIn: [filteredActivityId] };
              break;
            case PimTab.UserTasks:
              filter = { ...filter, taskDefinitionKey: filteredActivityId };
              break;
            default:
              filter = { ...filter, activityId: filteredActivityId };
          }
        }
        this.updateCountForTab({ tab, filter: filter });
      }
    }
  }

  override getInitialTabCount(tab: PimTab): Observable<number> {
    switch (tab) {
      case PimTab.Variables:
        return this.variableService.getProcessVariableCountByFilter(
          { processInstanceIdIn: [this.itemId] },
          this.isUnfinished,
        );
      case PimTab.DecisionInstances:
        return this.decisionInstanceService.getInstancesCount({
          processInstanceId: this.itemId,
          ...(this.filteredActivityId && { activityIdIn: [this.filteredActivityId] }),
        });
      case PimTab.Incidents:
        return this.incidentsService.getIncidentCountByFilter({
          processInstanceId: this.itemId,
          open: true,
          activityId: this.filteredActivityId,
        });
      case PimTab.CalledProcessInstances:
        return this.calledProcessInstanceService.getCalledProcessInstanceCount({
          processInstanceId: this.itemId,
          activityId: this.filteredActivityId,
        });
      case PimTab.History:
        return this.getHistoryCountLengthObservable();
      case PimTab.Jobs:
        return this.isUnfinishedInstance
          ? this.jobsService.getJobCountByFilter({
              processInstanceId: this.itemId,
              activityId: this.filteredActivityId,
            })
          : of(0);
      case PimTab.UserTasks:
        return this.userTaskService.getUserTaskCountByFilter({
          processInstanceId: this.itemId,
          taskDefinitionKey: this.filteredActivityId,
        });
      default:
        console.error(`No getInitialTabCount implementation for tab ${tab}`);
        return of(0);
    }
  }

  override getInitialTabCountsObservable() {
    return (
      combineLatest(
        [
          PimTab.Variables,
          PimTab.DecisionInstances,
          PimTab.Incidents,
          PimTab.CalledProcessInstances,
          PimTab.History,
          PimTab.Jobs,
          PimTab.UserTasks,
        ].map((pimTab) => this.getInitialTabCount(pimTab)),
      )
        .pipe(
          map(
            ([
              variablesCount,
              decisionInstanceCount,
              incidentsCount,
              calledProcessInstanceCount,
              historyCount,
              jobsCount,
              userTasksCount,
            ]) => {
              const counts = {};
              return Object.assign(counts, this.counts, {
                [PimTab.Variables]: variablesCount,
                [PimTab.DecisionInstances]: decisionInstanceCount,
                [PimTab.Incidents]: incidentsCount,
                [PimTab.CalledProcessInstances]: calledProcessInstanceCount,
                [PimTab.History]: historyCount,
                ...(this.isUnfinishedInstance ? { [PimTab.Jobs]: jobsCount } : {}),
                [PimTab.UserTasks]: userTasksCount,
              });
            },
          ),
        )
        // Only need this subscription when the component inits
        // If we don't unsubscribe then the counts flicker when filters/sorting change
        .pipe(take(1))
    );
  }

  getHistoryCountLengthObservable(tabAndFilter?: { tab: string; filter: any }) {
    const itemId = this.route?.snapshot?.params.id ?? '';
    const typeFilters = tabAndFilter?.filter.typeFilters ?? [];
    const isLoadAll = tabAndFilter?.filter.isLoadAll ?? false;

    return this.instanceService.getFullHistoryCount(itemId, typeFilters, isLoadAll);
  }

  override getUpdatedTabCountsObservable(tabAndFilter: { tab: string; filter: any }) {
    {
      let serviceObservable: Observable<number> | undefined;

      switch (tabAndFilter.tab) {
        case PimTab.Incidents:
          serviceObservable = this.incidentsService.getIncidentCountByFilter(tabAndFilter.filter);
          break;
        case PimTab.JobDefinitions:
          serviceObservable = this.jobsService.getJobCountByFilter(tabAndFilter.filter);
          break;
        case PimTab.DecisionInstances:
          serviceObservable = this.decisionInstanceService.getInstancesCount(tabAndFilter.filter);
          break;
        case PimTab.CalledProcessInstances:
          serviceObservable = this.calledProcessInstanceService.getCalledProcessInstanceCount(tabAndFilter.filter);
          break;
        case PimTab.Variables:
          serviceObservable = this.variableService.getProcessVariableCountByFilter(
            tabAndFilter.filter,
            this.isUnfinished,
          );
          break;
        case PimTab.History:
          serviceObservable = this.getHistoryCountLengthObservable(tabAndFilter);
          break;
        case PimTab.Jobs:
          serviceObservable = this.jobsService.getJobCountByFilter(tabAndFilter.filter);
          break;
        case PimTab.UserTasks:
          serviceObservable = this.userTaskService.getUserTaskCountByFilter(tabAndFilter.filter);
          break;
      }

      return !!serviceObservable && !!tabAndFilter.tab
        ? serviceObservable.pipe(map((count) => ({ [tabAndFilter.tab]: count })))
        : of({});
    }
  }

  public getAllIncidents = (activityInstances: ActivityInstance[] = []): { id: string; activityId: string }[] =>
    activityInstances.reduce(
      (acc, instance) => {
        const incidents = instance.incidents || [];
        const childIncidents = this.getAllIncidents([
          ...(instance.childActivityInstances || []),
          ...(instance.childTransitionInstances || []),
        ]);
        return acc.concat(incidents, childIncidents);
      },
      [] as { id: string; activityId: string }[],
    );

  loadProcessInstanceDetailData(id: string) {
    this.instanceSub?.unsubscribe();
    this.instanceSub = this.instanceService.getProcessInstance(id).subscribe((processInstance) => {
      if (!processInstance) {
        this.isItemFound$ = of(false);
        return;
      }
      this.processInstance = processInstance;

      if (this.diagramComponent) this.diagramComponent.id = this.processInstance?.processDefinitionId || '';
      this.enableModificationTools = ProcessInstanceStatesMap.ACTIVE.value === this.processInstance?.state;

      this.toolbar?.updateButtonStates(this.processInstance);
    });

    this.activityInstancesSub?.unsubscribe();
    this.activityInstancesSub = this.instanceService.getActivityInstances(id).subscribe((activityInstances) => {
      this.activityInstanceInfo = activityInstances;
      this.activeActivityInstance = activityInstances?.active;
      this.history = activityInstances?.historical;

      const activeIncidents = this.getAllIncidents([
        ...(this.activeActivityInstance?.childActivityInstances || []),
        ...(this.activeActivityInstance?.childTransitionInstances || []),
      ]);

      const cleanedActivities = this.consolidateActivityPseudoIds(groupBy(activeIncidents, 'activityId'));

      this.incidents = lodashMap(cleanedActivities, (incidents: any, activityId: any) => ({
        totalIncidents: incidents.length,
        failedActivityId: activityId,
      }));

      this.markupDiagram();
    });
  }

  public setSequenceFlows(event: any) {
    this.sequenceFlows = event;
  }

  public colorSequenceFlows() {
    const activityInstanceMap: { [activityId: string]: ActivityInstance[] } = {};
    const activityHasExitedMap: { [activityId: string]: boolean } = {};
    const exclusiveGatewayTargetMap: { [gatewayActivityId: string]: ActivityInstance[] } = {};
    const sequencesToHighlight: { id: string; element: any }[] = [];
    [
      ...((this.history as any[]) ?? []),
      ...(this.flattenActivities(this.activityInstanceInfo?.active.childActivityInstances ?? []) ?? []),
      ...(this.flattenActivities(this.activityInstanceInfo?.active.childTransitionInstances ?? []) ?? []),
    ].forEach((activityInstance) => {
      if (!activityInstanceMap[activityInstance.activityId]) {
        activityInstanceMap[activityInstance.activityId] = [];
      }
      activityInstanceMap[activityInstance.activityId].push(activityInstance);
      let returnVal = false;
      if (!activityHasExitedMap[activityInstance.activityId]) {
        if (!activityInstance.endTime || activityInstance.canceled) {
          returnVal = false;
        } else {
          returnVal = activityInstance?.endTime && !activityInstance.canceled;
        }
        // has exited is true if there is an endTime, and it was not canceled
        activityHasExitedMap[activityInstance.activityId] = returnVal;
      }
      if (
        activityInstance.activityType === 'exclusiveGateway' &&
        !exclusiveGatewayTargetMap[activityInstance.activityId]
      ) {
        exclusiveGatewayTargetMap[activityInstance.activityId] = [];
      }
    });
    // Construct a map of exclusive gateway targets so we can later determine which sequence flow to highlight
    this.sequenceFlows.forEach((sequence) => {
      if (
        exclusiveGatewayTargetMap[sequence.sourceActivityId as string] &&
        activityInstanceMap[sequence.targetActivityId as string]
      ) {
        exclusiveGatewayTargetMap[sequence.sourceActivityId as string].push(
          ...activityInstanceMap[sequence.targetActivityId as string],
        );
      }
    });
    // The "flow" is determined by activityInstances on the shapes.
    // We just want the sequenceNodes in between shapes
    // Loop through activity instances. All of them start as exited = false
    // if there is no endTime, then shape has not been exited. Same with a truthy endTime and canceled = true
    // else if there is an endTime and canceled is false, then a shape has been exited organically ie not moving a token
    // THEN
    // loop through sequenceNodeArray. If sourceActivityId is true in activityHasExitedMap and there is a key for targetActivityId in activityHasExitedMap, then the sequence shape should be highlighted
    this.sequenceFlows.forEach((sequence) => {
      // Exclusive gateways need some additional logic to cover edge cases
      if (
        exclusiveGatewayTargetMap[sequence.sourceActivityId as string] &&
        exclusiveGatewayTargetMap[sequence.sourceActivityId as string].length > 1
      ) {
        const targets = exclusiveGatewayTargetMap[sequence.sourceActivityId as string];
        const sources = activityInstanceMap[sequence.sourceActivityId as string];
        let validTarget = false;

        // Pre-process targets (filter invalid dates, sort by time)
        const validTargetsByTime = targets
          .filter((target) => target.startTime)
          .map((target) => ({ ...target, startTimeMoment: moment(target.startTime) }))
          .filter((target) => target.startTimeMoment.isValid())
          .sort((a, b) => a.startTimeMoment.diff(b.startTimeMoment));

        // For each source, we need to find the target that started soonest after the source started
        // If that target matches the target of the sequence flow, then we highlight it
        for (const source of sources) {
          const sourceStartTime = moment(source.startTime as string);
          if (!sourceStartTime.isValid()) continue;

          // Find first target after source time (already sorted)
          const earliestValidTarget = validTargetsByTime.find((target) =>
            target.startTimeMoment.isAfter(sourceStartTime),
          );

          if (earliestValidTarget?.activityId === sequence.targetActivityId) {
            validTarget = true;
            break;
          }
        }
        if (!validTarget) {
          return;
        }
      }
      if (
        activityHasExitedMap[sequence.sourceActivityId as string] &&
        (sequence.targetActivityId as string) in activityHasExitedMap
      ) {
        // Guard against loop-back false positives by verifying temporal ordering.
        // A sequence is only valid if a target instance started on or after a source instance ended.
        const sourceInstances = activityInstanceMap[sequence.sourceActivityId as string] ?? [];
        const targetInstances = activityInstanceMap[sequence.targetActivityId as string] ?? [];

        // Precompute valid target start times as moments to avoid repeated parsing in the inner loop
        const validTargetInstancesByMoment = targetInstances
          .filter((target) => target.startTime)
          .map((target) => ({
            ...target,
            startTimeMoment: moment(target.startTime as string),
          }))
          .filter((target) => target.startTimeMoment.isValid());

        const hasValidTemporalOrder = sourceInstances
          .filter((s) => s.endTime && !(s as ActivityInstanceHistory).canceled)
          .some((source) => {
            const sourceEndTime = moment(source.endTime as string);
            if (!sourceEndTime.isValid()) return false;
            return validTargetInstancesByMoment.some((target) => target.startTimeMoment.isSameOrAfter(sourceEndTime));
          });

        if (hasValidTemporalOrder) {
          sequencesToHighlight.push({
            id: sequence.sequenceId,
            element: document.querySelector(`[data-element-id="${sequence.sequenceId}"] g`),
          });
        }
      }
    });
    this.diagramOverlaysUtil?.colorFlows(sequencesToHighlight, this.diagramFlowHighlighted);
  }

  override markupDiagram() {
    if (this.diagramRendered && (this.activeActivityInstance || this.history)) {
      // Need to add tokens to the diagram before adding
      // incidents, otherwise the incident will be removed
      this.addTokensToDiagram();
      this.colorDiagram();
      super.markupDiagram();
    }
  }

  public colorDiagram() {
    this.colorSequenceFlows();
    this.colorShapes();
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    let servObs: Observable<any> | undefined;

    if (event.action === 'click') {
      switch (event.target) {
        case ButtonActions.ACTIVATE:
        case ButtonActions.SUSPEND:
          servObs = await this.confirmActionService.suspendOrActivateInstance(
            this.tenantId,
            [this.itemId],
            event.target === ButtonActions.SUSPEND,
          );
          break;
        case ButtonActions.TERMINATE:
          servObs = await this.confirmActionService.terminateInstance(this.tenantId, [this.itemId]);
          break;
        case ButtonActions.DOWNLOAD_RESOURCE: {
          await this.resourceUtilsService.downloadDiagramResource(
            this.processInstance?.processDefinitionId ?? '',
            this.processInstance?.processDefinitionKey ?? '',
          );
          break;
        }
        case ButtonActions.APPLY_CHANGES: {
          const willTerminate = this.commandStack.willActionsTerminateProcess(this.activityInstanceInfo);
          const result = await this.applyChangesModalService.show(
            { willTerminate },
            {
              ...MODAL_DEFAULTS,
              modalDialogClass: 'dynamic-modal',
            },
          );

          if (result.confirmed) {
            this.commandStack.execute({
              skipIoMappings: result.skipIoMappings,
              skipCustomListeners: result.skipCustomListeners,
              annotation: result.annotation,
            });
          } else if (result.clearChanges) {
            this.commandStack.clear();
          }
        }
      }
    }

    if (event.target === 'diagramTools') {
      switch (event.action) {
        case 'edit':
          this.setEditing(event.value);
          break;
        case 'zoom':
          this.diagramComponent?.zoomDiagram(event.value);
          break;
        case 'reset-view':
          this.diagramComponent?.recenterDiagramView();
          break;
      }
    }

    if (servObs) {
      servObs.pipe(take(1)).subscribe((res) => {
        if (!res || !res.canceled) {
          this.eventBus.reloadNeeded();
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  override onClickOutsideDiagram() {
    super.onClickOutsideDiagram();
  }

  setEditing(isEditing: boolean) {
    this.isEditing = isEditing;
    if (!isEditing) {
      this.diagramOverlaysUtil?.selectionService?.select(null);
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.instanceSub?.unsubscribe();
    this.activityInstancesSub?.unsubscribe();
    this.eventBus.reset();
    this.commandStackService.clear();
  }

  protected colorShapes(): void {
    const groupedHistory = this.consolidateActivityPseudoIds(groupBy(this.history, 'activityId'));
    Object.keys(groupedHistory).forEach((key) => {
      const historyItem = groupedHistory[key][0];
      this.removeAllMarkersOnActivity(key);
      if (this.diagramFlowHighlighted) {
        this.diagramOverlaysUtil?.canvas?.addMarker(
          key,
          this.getMarkerType(!!historyItem.endTime, historyItem.canceled || false),
        );

        if (this.diagramOverlaysUtil?.elementRegistry.get(key).type.toLowerCase().includes('gateway')) {
          this.diagramOverlaysUtil?.canvas?.addMarker(key, 'solid-paths');
        }
      }
    });
    if (this.incidents) {
      this.incidents.forEach((incident: ActivityIncident) => {
        this.removeAllMarkersOnActivity(incident.failedActivityId);
        if (this.diagramFlowHighlighted) {
          this.diagramOverlaysUtil?.canvas?.addMarker(incident.failedActivityId, 'incident');
          if (
            this.diagramOverlaysUtil?.elementRegistry
              .get(incident.failedActivityId)
              .type.toLowerCase()
              .includes('gateway')
          ) {
            this.diagramOverlaysUtil?.canvas?.addMarker(incident.failedActivityId, 'solid-paths');
          }
        }
      });
    }
  }

  private addTokensToDiagram() {
    const groupedHistory = this.consolidateActivityPseudoIds(groupBy(this.history, 'activityId'));

    Object.keys(groupedHistory).forEach((key) => {
      this.diagramOverlaysUtil?.overlays?.remove({ element: key });
      let terminatedTokenCount = 0;
      let completedTokenCount = 0;

      groupedHistory[key].forEach((historyItem1: any) => {
        const type = this.getMarkerType(!!historyItem1.endTime, historyItem1.canceled || false);
        if (type === ActivityMarkers.CANCELED) {
          terminatedTokenCount += 1;
        } else if (type === ActivityMarkers.COMPLETED) {
          completedTokenCount += 1;
        }
      });

      if (terminatedTokenCount > 0) {
        this.diagramOverlaysUtil?.addTokenToDiagram(key, terminatedTokenCount, 'terminated-token');
      }
      if (completedTokenCount > 0) {
        this.diagramOverlaysUtil?.addTokenToDiagram(key, completedTokenCount, 'completed-token');
      }
    });
    this.addActiveTokensToDiagram();
  }

  private addActiveTokensToDiagram() {
    const childActivityInstances = this.activeActivityInstance?.childActivityInstances
      ? this.flattenActivities(this.activeActivityInstance?.childActivityInstances)
      : [];
    const childTransitionInstances = this.activeActivityInstance?.childTransitionInstances || [];
    const combinedArray = [...childActivityInstances, ...childTransitionInstances];
    const groupedActivities = this.consolidateActivityPseudoIds(groupBy(combinedArray, 'activityId'));
    Object.keys(groupedActivities).forEach((key) => {
      this.diagramOverlaysUtil?.addTokenToDiagram(key, groupedActivities[key].length, 'active-token');
    });
  }

  override handleTabFilterUpdate(tabAndFilter: { tab: string; filter: FilterModel }) {
    this.alignActivityIds(tabAndFilter);
    super.handleTabFilterUpdate(tabAndFilter);
  }

  private flattenActivities(instanceArray: ActivityInstance[]): (ActivityInstance | TransitionInstance)[] {
    let result: (ActivityInstance | TransitionInstance)[] = [];

    instanceArray.forEach((instance) => {
      result.push(instance);

      if (instance.childActivityInstances && instance.childActivityInstances?.length > 0) {
        result = result.concat(this.flattenActivities(instance.childActivityInstances));
      }

      if (instance.childTransitionInstances && instance.childTransitionInstances.length > 0) {
        result = result.concat(instance.childTransitionInstances);
      }
    });
    return result;
  }

  @HostListener('window:resize', ['$event'])
  override onCanvasSizeChanged() {
    this.diagramComponent?.notifyCanvasSizeChanged();
  }
}
