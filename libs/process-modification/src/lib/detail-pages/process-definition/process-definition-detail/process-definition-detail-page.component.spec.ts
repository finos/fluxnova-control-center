/* eslint-disable max-lines */
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom, of, Subject, throwError } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivityInstanceHistory, CalledProcessDefinition, ProcessDefinitionStatistic } from '@fxn/types';
import NavigatedViewer from 'bpmn-js/lib/Viewer';
import { pageSizeMax } from '@fxn/grid';
import { HeatmapData, HeatmapParams } from 'visual-heatmap';
import moment from 'moment';
import { acceptedDateFormats, ToastService } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { MockViewerService } from '@fxn/test-support/vitest';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { DeploymentResourceUtilsService } from '../../../services/deployment-resource-utils.service';
import { IncidentService } from '../../../services/incident.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { JobService } from '../../../services/job.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimTab } from '../../item-detail-tab-utils';
import { GenericDiagramSectionViewComponent } from '../../../common/diagram/generic-diagram-viewer.component';
import { ActivityMarkers } from '../../diagram.mixin';
import { DiagramOverlaysUtil } from '../../diagram-section/diagram-overlays-util';
import { DATA_RELOAD_DELAY } from '../../../common/app-constants';
import { DiagramAnimationUtil } from '../../diagram-section/diagram-animation-util';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { HeatmapUtil } from '../../diagram-section/heatmap-util';
import { ProcessDefinitionDetailPageComponent } from './process-definition-detail-page.component';

vi.mock('visual-heatmap', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(function () {
    return {
      clear: vi.fn().mockReturnThis(),
      setTranslate: vi.fn().mockReturnThis(),
      setZoom: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setMin: vi.fn().mockReturnThis(),
      setMax: vi.fn().mockReturnThis(),
      resize: vi.fn().mockReturnThis(),
      render: vi.fn().mockReturnThis(),
      renderData: vi.fn().mockReturnThis(),
    };
  }),
}));

const itemId = 'itemId123';

describe('Process Definition Detail Page Component', () => {
  let component: ProcessDefinitionDetailPageComponent;
  let fixture: ComponentFixture<ProcessDefinitionDetailPageComponent>;

  const mockRoute: Mocked<ActivatedRoute> = {
    snapshot: {
      data: {
        itemType: 'ProcessDefinition',
        itemTypeListName: 'Mock List Name',
        itemTypeName: 'Mock Type Name',
        itemTypeClass: 'mock-type-class',
      },
      params: { id: itemId },
      queryParams: { tab: 'job-definitions' },
    },
    params: of({ id: itemId }),
  } as unknown as Mocked<ActivatedRoute>;

  const mockRouter: Mocked<Router> = {
    navigate: vi.fn(),
  } as unknown as Mocked<Router>;

  const mockToolbarService: Mocked<ToolbarService> = {
    emitter: new EventEmitter<ToolbarEvent>(),
  } as unknown as Mocked<ToolbarService>;

  let confirmActionService: ConfirmActionService;

  const mockIncidents = {
    getIncidentCountByFilter: vi.fn().mockImplementation(() => of({})),
  };
  const mockInstances = {
    getProcessInstanceCountByFilter: vi.fn(),
    getProcessInstanceHistoryCountByFilter: vi.fn().mockImplementation(() => of({})),
  };
  const mockJobs = {
    getJobCountByFilter: vi.fn(),
    getJobDefinitionsCountByFilter: vi.fn().mockImplementation(() => of({})),
    getJobDefinitionsByFilter: vi.fn().mockImplementation(() => of([])),
  };
  const mockDecisionInstancesService = {
    getInstancesCount: vi.fn().mockImplementation(() => of({})),
  } as unknown as Mocked<DecisionInstanceService>;

  const mockDefinitionService: Mocked<ProcessDefinitionService> = {
    getCalledProcessDefinitions: vi.fn().mockImplementation(() => of({})),
    getProcessDefinitionsByFilter: vi.fn().mockImplementation(() => of([{ id: 'itemId123', key: 'asdf' }])),
    activateDefinition: vi.fn().mockImplementation(() => of({})),
    suspendDefinition: vi.fn().mockImplementation(() => of({})),
    deleteDefinition: vi.fn().mockImplementation(() => of({})),
    getStatistics: vi.fn().mockImplementation(() => of([])),
    getActivityInstanceHistory: vi.fn().mockImplementation(() => of({ detail: [] })),
  } as unknown as Mocked<ProcessDefinitionService>;

  const mockResourceUtilsService: Mocked<DeploymentResourceUtilsService> = {
    downloadDiagramResource: vi.fn(),
  } as unknown as Mocked<DeploymentResourceUtilsService>;

  const statsStub = [
    {
      id: 'Empty_Task',
      instances: 12,
      failedJobs: 0,
      incidents: [
        { incidentType: 'failedJob', incidentCount: 42 },
        { incidentType: 'anIncident', incidentCount: 20 },
      ],
    },
    {
      id: 'alternate_task',
      instances: 13,
      failedJobs: 0,
      incidents: [
        { incidentType: 'failedJob', incidentCount: 43 },
        { incidentType: 'anIncident', incidentCount: 22 },
        { incidentType: 'anotherIncident', incidentCount: 15 },
      ],
    },
  ] as ProcessDefinitionStatistic[];

  const mockToastService = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessDefinitionDetailPageComponent],
      imports: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ToolbarService, useValue: mockToolbarService },
        { provide: IncidentService, useValue: mockIncidents },
        { provide: ProcessInstanceService, useValue: mockInstances },
        { provide: DecisionInstanceService, useValue: mockDecisionInstancesService },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
        { provide: JobService, useValue: mockJobs },
        { provide: ItemDetailPageCommunicationService },
        { provide: DeploymentResourceUtilsService, useValue: mockResourceUtilsService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });
    confirmActionService = TestBed.inject(ConfirmActionService);
    fixture = TestBed.createComponent(ProcessDefinitionDetailPageComponent);
    component = fixture.componentInstance;
    component.itemId$ = of(itemId);
    component.queryParams$ = of({ tab: 'incidents' });
    fixture.detectChanges();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set observables for is item found on init', async () => {
    component.ngOnInit();
    await expect(lastValueFrom(component.isItemFound$ as any)).resolves.toEqual(true);
  });

  it('should set observables for tabs on set up tabs', async () => {
    component.setUpTabs();
    expect(component.tabs).toEqual([
      'instances',
      'incidents',
      'job-definitions',
      'called-process-definitions',
      'decision-instances',
    ]);
  });

  it('should set observables for tab counts on set up tabs', async () => {
    mockInstances.getProcessInstanceHistoryCountByFilter.mockReturnValue(of(1));
    mockJobs.getJobDefinitionsCountByFilter.mockReturnValue(of(1));
    mockIncidents.getIncidentCountByFilter.mockReturnValue(of(1));
    mockDecisionInstancesService.getInstancesCount.mockReturnValue(of(1));
    mockDefinitionService.getCalledProcessDefinitions.mockReturnValue(of([{} as CalledProcessDefinition]));
    component.setUpTabs();

    expect(component.counts).toEqual({
      instances: 1,
      incidents: 1,
      'job-definitions': 1,
      'called-process-definitions': 1,
      'decision-instances': 1,
    });
  });

  it('should load process definition detail page data on init', async () => {
    component.ngOnInit();
    await vi.advanceTimersByTimeAsync(1);
    expect(mockDefinitionService.getProcessDefinitionsByFilter).toHaveBeenCalledTimes(1);
    expect(mockDefinitionService.getStatistics).toHaveBeenCalledTimes(1);
    expect(mockDefinitionService.getActivityInstanceHistory).toHaveBeenCalledTimes(1);
  });

  it('should show a toast and return an empty array if getActivityInstanceHistory fails', async () => {
    mockDefinitionService.getActivityInstanceHistory.mockImplementationOnce(() =>
      throwError(() => new Error('Service Timeout')),
    );

    component.loadProcessDefinitionDetailData(itemId);
    await vi.advanceTimersByTimeAsync(1);

    expect(mockToastService.error).toHaveBeenCalledWith(
      'Problem loading activity instance history for the process definition. Tokens will not be displayed on the diagram.',
    );
  });

  it('should handle button click events from the toolbar service emitter', () => {
    const event = { target: 'activate', action: 'click' };

    component.onToolbarButtonClick = vi.fn();
    component.itemId$ = of(itemId);
    component.queryParams$ = of({ tab: 'incidents' });
    fixture.detectChanges();
    component.ngOnInit();

    mockToolbarService.emitter.emit(event);

    expect(component.onToolbarButtonClick).toHaveBeenCalledWith(event);
  });

  it('should clear subscriptions on destroy', () => {
    const resetSpy = vi.spyOn(component.eventBus, 'reset');
    component.ngOnDestroy();

    expect(resetSpy).toHaveBeenCalled();
  });

  it('should update tab counts', () => {
    const filter = {
      open: true,
      processDefinitionId: 'itemId123',
    };

    component.ngOnInit();

    component.updateCountForTab({ tab: PimTab.Instances, filter });
    component.updateCountForTab({ tab: PimTab.DecisionInstances, filter });
    component.updateCountForTab({ tab: PimTab.JobDefinitions, filter });
    component.updateCountForTab({ tab: PimTab.CalledProcessDefinitions, filter });

    expect(mockIncidents.getIncidentCountByFilter).toHaveBeenCalledWith(filter);
    expect(mockDecisionInstancesService.getInstancesCount).toHaveBeenCalledWith(filter);
    expect(mockJobs.getJobDefinitionsCountByFilter).toHaveBeenCalledWith(filter);
    expect(mockDefinitionService.getCalledProcessDefinitions).toHaveBeenCalledWith(
      new PaginatedDataRequest(filter, pageSizeMax),
    );
  });

  it('given an array of statistics, it should return an array of incidents', () => {
    const incidents = component.convertStatisticsToIncidents(statsStub);
    const expected = [
      { failedActivityId: statsStub[0].id, totalIncidents: 62 },
      { failedActivityId: statsStub[1].id, totalIncidents: 80 },
    ];

    expect(incidents).toEqual(expected);
  });

  it('given an empty array of statistics, it should return an empty array of incidents', () => {
    const stats = [] as ProcessDefinitionStatistic[];
    const incidents = component.convertStatisticsToIncidents(stats);
    const expected: any = [];

    expect(incidents).toEqual(expected);
  });

  it('should prepare the diagram to be updated with more info', () => {
    const highlightActivitySpy = vi.spyOn(component, 'highlightActivity');
    const showIncidentTokensOnDiagramSpy = vi.spyOn(component, 'showIncidentTokensOnDiagram');
    const setupActivityBehaviorsSpy = vi.spyOn(component, 'setupActivityBehaviors');
    const showSuspendedJobDefinitionsOnDiagramSpy = vi.spyOn(component, 'updateJobDefinitionsOverlayOnDiagram');
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);

    expect(component.diagramRendered).toBe(true);
    expect(component.diagramOverlaysUtil).toBeDefined();
    expect(highlightActivitySpy).toHaveBeenCalled();
    expect(showIncidentTokensOnDiagramSpy).toHaveBeenCalled();
    expect(setupActivityBehaviorsSpy).toHaveBeenCalled();
    expect(showSuspendedJobDefinitionsOnDiagramSpy).toHaveBeenCalled();
  });

  it('should highlight incidents if they exist', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.highlightIncidents();
    expect(component.diagramOverlaysUtil?.canvas.addMarker).toHaveBeenCalledTimes(0);
    component.incidents = [{ totalIncidents: 1, failedActivityId: '123' }];
    component.highlightIncidents();
    expect(component.diagramOverlaysUtil?.canvas.addMarker).toHaveBeenCalledWith('123', 'incident');
  });

  it('should clear incident highlights', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.clearIncidentHighlights();
    expect(component.diagramOverlaysUtil?.canvas.removeMarker).toHaveBeenCalledTimes(0);
    component.incidents = [{ totalIncidents: 1, failedActivityId: '123' }];
    component.clearIncidentHighlights();
    expect(component.diagramOverlaysUtil?.canvas.removeMarker).toHaveBeenCalledWith('123', 'incident');
  });

  it('should not prepare the diagram if the diagram fails to render', () => {
    const highlightActivitySpy = vi.spyOn(component, 'highlightActivity');
    const showIncidentTokensOnDiagramSpy = vi.spyOn(component, 'showIncidentTokensOnDiagram');
    const setupActivityBehaviorsSpy = vi.spyOn(component, 'setupActivityBehaviors');
    const showSuspendedJobDefinitionsOnDiagramSpy = vi.spyOn(component, 'updateJobDefinitionsOverlayOnDiagram');
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(false);

    expect(component.diagramRendered).toBe(false);
    expect(component.diagramOverlaysUtil).not.toBeDefined();
    expect(highlightActivitySpy).not.toHaveBeenCalled();
    expect(showIncidentTokensOnDiagramSpy).not.toHaveBeenCalled();
    expect(setupActivityBehaviorsSpy).not.toHaveBeenCalled();
    expect(showSuspendedJobDefinitionsOnDiagramSpy).not.toHaveBeenCalled();
  });

  it('should update the diagram when instanceStatisticsShown updates', () => {
    component.diagramRendered = true;
    const clearTokensSpy = vi.spyOn(component, 'clearTokens');
    const clearIncidentHighlightsSpy = vi.spyOn(component, 'clearIncidentHighlights');
    const markupDiagramSpy = vi.spyOn(component, 'markupDiagram');

    component.eventBus.instanceStatisticsShown$.next(true);

    expect(clearTokensSpy).toHaveBeenCalled();
    expect(clearIncidentHighlightsSpy).toHaveBeenCalled();
    expect(markupDiagramSpy).toHaveBeenCalled();
    vi.clearAllMocks();

    component.eventBus.instanceStatisticsShown$.next(false);

    expect(clearTokensSpy).toHaveBeenCalled();
    expect(clearIncidentHighlightsSpy).toHaveBeenCalled();
    expect(markupDiagramSpy).not.toHaveBeenCalled();
  });

  it('should update the diagram when activityFilterActive updates', () => {
    const qps = new Subject<object>();
    component.queryParams$ = qps.asObservable();
    component.ngOnInit();

    const spyTarget = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {});
    const opacitySpy = vi.spyOn(spyTarget, 'updateDiagramOpacity');
    component.diagramOverlaysUtil = spyTarget;

    qps.next({ filteredActivityId: 'testActivity' });

    expect(opacitySpy).toHaveBeenCalledWith('testActivity');

    qps.next({ filteredActivityId: undefined });

    expect(opacitySpy).toHaveBeenCalledWith(undefined);
  });

  it('should update the tab counts when activityFilterActive updates', () => {
    const qps = new Subject<object>();
    component.queryParams$ = qps.asObservable();
    component.ngOnInit();

    const updateTabCountsSpy = vi.spyOn(component, 'updateTabCountsForFilteredActivity');

    qps.next({ filteredActivityId: 'testActivity' });

    expect(updateTabCountsSpy).toHaveBeenCalledWith('testActivity');

    qps.next({ filteredActivityId: undefined });

    expect(updateTabCountsSpy).toHaveBeenCalledWith(undefined);
  });

  it('should return CANCELED for ended && canceled', () => {
    expect(component.getMarkerType(true, true)).toEqual(ActivityMarkers.CANCELED);
  });

  it('should return COMPLETED for ended && canceled', () => {
    expect(component.getMarkerType(true, false)).toEqual(ActivityMarkers.COMPLETED);
  });

  it('should return CANCELED for ended && canceled', () => {
    expect(component.getMarkerType(false, true)).toEqual(ActivityMarkers.IN_PROGRESS);
    expect(component.getMarkerType(false, false)).toEqual(ActivityMarkers.IN_PROGRESS);
  });

  it('should add tokens to the diagram', () => {
    const spyTarget = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {});
    const spy = vi.spyOn(spyTarget, 'addTokenToDiagram');
    const hist: ActivityInstanceHistory[] = [
      { id: 'qwer', activityId: 'asdf' },
      { id: 'qwerx', activityId: 'asdf2', endTime: '2' },
    ];

    component.diagramOverlaysUtil = spyTarget;
    component.addInProgressTokensToDiagram(hist);

    expect(spy).toHaveBeenCalledWith('asdf', 1, 'active-token');
    expect(spy).not.toHaveBeenCalledWith('asdf2', 1, expect.any(String));
  });

  it('should add suspended tokens to the diagram', () => {
    const spyTarget = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {});
    const spy = vi.spyOn(spyTarget, 'addSuspendToDiagram');
    component.jobDefinitions = [
      { activityId: 'activityId1', suspended: true },
      { activityId: 'activityId2', suspended: false },
    ];
    component.diagramRendered = true;
    component.diagramOverlaysUtil = spyTarget;
    component.updateJobDefinitionsOverlayOnDiagram();

    expect(spy).toHaveBeenCalledWith('activityId1');
    expect(spy).not.toHaveBeenCalledWith('activityId2');
  });

  it('should call clear on the diagram overlays util', () => {
    const spyTarget = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {});
    const spy = vi.spyOn(spyTarget, 'clearToken');
    component.activityInstanceHistory = [
      { id: 'qwer', activityId: 'asdf' },
      { id: 'qwerx', activityId: 'asdf2', endTime: '2' },
    ];
    component.diagramOverlaysUtil = spyTarget;
    component.clearTokens();

    expect(spy).toHaveBeenCalled();
  });

  it('should handle job definition suspension status change', () => {
    const spyTarget = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {});
    const addSuspendTokenSpy = vi.spyOn(spyTarget, 'addSuspendToDiagram');
    const removeSuspendTokenSpy = vi.spyOn(spyTarget, 'removeSuspendFromDiagram');
    const activityIds = ['asdf', 'fdsa'];
    component.diagramOverlaysUtil = spyTarget;
    const mockJobDefinition = {
      activityId: 'asdf',
      suspended: false,
    };
    component.jobDefinitions = [mockJobDefinition];

    component.onJobDefSuspensionChanged({
      activityIds,
      suspended: true,
    });
    expect(mockJobDefinition.suspended).toBeTruthy();
    expect(addSuspendTokenSpy).toHaveBeenCalledTimes(2);

    component.onJobDefSuspensionChanged({
      activityIds,
      suspended: false,
    });
    expect(mockJobDefinition.suspended).toBeFalsy();
    expect(removeSuspendTokenSpy).toHaveBeenCalledTimes(2);
  });

  describe('on activate button click', () => {
    it('should call suspendOrActivate', () => {
      const event = { target: 'activate', action: 'click' };
      const spy = vi.spyOn(confirmActionService, 'activateOrSuspendDefinition');
      mockToolbarService.emitter.emit(event);

      expect(spy).toHaveBeenCalledWith([itemId], 'Activate', expect.any(Function));
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'activate', action: 'click' };
      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: true, confirmed: false }),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(reloadNeededSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when the action is not a click action', async () => {
      const event = { target: 'activate', action: 'notClick' };
      const spy = vi.spyOn(confirmActionService, 'activateOrSuspendDefinition');
      mockToolbarService.emitter.emit(event);

      expect(spy).not.toHaveBeenCalledWith([itemId], expect.any(Function));
    });

    it('should refresh the data on success by calling reloadNeeded', async () => {
      const event = { target: 'activate', action: 'click' };
      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: false, confirmed: true }),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(reloadNeededSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on suspend button click', () => {
    it('should call suspendOrActivate', () => {
      const event = { target: 'suspend', action: 'click' };
      const spy = vi.spyOn(confirmActionService, 'activateOrSuspendDefinition');
      mockToolbarService.emitter.emit(event);

      expect(spy).toHaveBeenCalledWith([itemId], 'Suspend', expect.any(Function));
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'suspend', action: 'click' };

      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: true, confirmed: false }),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(reloadNeededSpy).not.toHaveBeenCalled();
    });

    it('should refresh the data on success by calling reloadNeeded', async () => {
      const event = { target: 'suspend', action: 'click' };

      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: false, confirmed: true }),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(reloadNeededSpy).toHaveBeenCalledTimes(1);
    });

    it('should load process definition data on reload needed', () => {
      const loadDataSpy = vi.spyOn(component, 'loadProcessDefinitionDetailData');
      component.eventBus.reloadNeeded$.next(true);

      expect(loadDataSpy).toHaveBeenCalledWith('itemId123');
    });
  });

  describe('on delete button click', () => {
    it('should call delete', () => {
      const event = { target: 'delete', action: 'click' };
      const spy = vi.spyOn(confirmActionService, 'deleteDefinition');
      mockToolbarService.emitter.emit(event);

      expect(spy).toHaveBeenCalledWith([itemId], expect.any(Function));
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'delete', action: 'click' };

      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: true, confirmed: false }),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(reloadNeededSpy).not.toHaveBeenCalled();
    });

    it('should go back to the definitions list page', async () => {
      const event = { target: 'delete', action: 'click' };

      vi.spyOn(confirmActionService, 'displayConfirmationModal').mockReturnValue(
        Promise.resolve({ canceled: false, confirmed: true }),
      );

      component.onToolbarButtonClick(event);

      await vi.advanceTimersByTimeAsync(201);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['../'], { relativeTo: mockRoute });
    });
  });

  describe('on start process button click', () => {
    it('should call startProcess', () => {
      const event = { target: 'start_process', action: 'click' };
      const spy = vi.spyOn(confirmActionService, 'startProcess');
      mockToolbarService.emitter.emit(event);

      expect(spy).toHaveBeenCalledWith(itemId, expect.any(Function));
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'start_process', action: 'click' };

      vi.spyOn(confirmActionService.startInstanceService, 'show').mockReturnValue(
        Promise.resolve({ submitted: false } as any),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      await component.onToolbarButtonClick(event);

      expect(reloadNeededSpy).not.toHaveBeenCalled();
    });

    it('on success, should refresh the data by calling reloadNeeded ', async () => {
      const event = { target: 'start_process', action: 'click' };
      const spy = vi
        .spyOn(confirmActionService, 'showStartProcessSuccessConfirmation')
        .mockImplementation(() => Promise.resolve({} as any));

      vi.spyOn(confirmActionService.startInstanceService, 'show').mockReturnValue(
        Promise.resolve({ submitted: true, instanceId: 'hello' } as any),
      );
      const reloadNeededSpy = vi.spyOn(component.eventBus, 'reloadNeeded');

      await component.onToolbarButtonClick(event);

      expect(reloadNeededSpy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('on download resource button click', () => {
    it('should call downloadResource', async () => {
      component.ngOnInit();

      await vi.advanceTimersByTimeAsync(DATA_RELOAD_DELAY);

      const event = { target: 'download_resource', action: 'click' };
      mockToolbarService.emitter.emit(event);

      expect(mockResourceUtilsService.downloadDiagramResource).toHaveBeenCalledWith('itemId123', 'asdf');
    });
  });

  describe('on diagram tools button click', () => {
    it('should handle diagram tools zoom action', () => {
      const event = { target: 'diagramTools', action: 'zoom', value: 1.5 };
      component.diagramComponent = {
        zoomDiagram: vi.fn(),
      } as unknown as GenericDiagramSectionViewComponent;

      component.onToolbarButtonClick(event);

      expect(component.diagramComponent?.zoomDiagram).toHaveBeenCalledWith(1.5);
    });

    it('should handle diagram tools reset-view action', () => {
      const event = { target: 'diagramTools', action: 'reset-view' };
      component.diagramComponent = {
        recenterDiagramView: vi.fn(),
      } as unknown as GenericDiagramSectionViewComponent;

      component.onToolbarButtonClick(event);

      expect(component.diagramComponent?.recenterDiagramView).toHaveBeenCalled();
    });
  });

  describe('centerElement', () => {
    let mockCanvas: any;
    let mockElementRegistry: any;
    let mockNavigatedViewer: NavigatedViewer;
    beforeEach(() => {
      mockCanvas = {
        viewbox: vi.fn(),
        zoom: vi.fn(),
        resized: vi.fn(),
      };
      mockElementRegistry = {
        get: vi.fn(),
        getAll: vi.fn(),
      };
      mockNavigatedViewer = {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'canvas') return mockCanvas;
          if (name === 'elementRegistry') return mockElementRegistry;
          return null;
        }),
      } as unknown as NavigatedViewer;

      component.diagramComponent = {
        navigatedViewer: mockNavigatedViewer,
      } as unknown as GenericDiagramSectionViewComponent;

      vi.spyOn(DiagramAnimationUtil, 'animatePan').mockResolvedValue(undefined);
      vi.spyOn(DiagramAnimationUtil, 'animateZoom').mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should center the element when row with activityId is clicked', () => {
      const centerElementSpy = vi.spyOn(component, 'centerElement');
      component.eventBus.rowClickedWithActivity$.next('activity');

      expect(centerElementSpy).toHaveBeenCalled();
    });

    it('should animate pan and zoom if valid activityId is provided', async () => {
      const mockElementBounds = { x: 100, y: 200, width: 50, height: 50 };
      const mockViewbox = { x: 0, y: 0, width: 500, height: 500 };
      mockElementRegistry.get.mockReturnValue(mockElementBounds);
      mockCanvas.viewbox.mockReturnValue(mockViewbox);
      mockCanvas.zoom.mockReturnValue(2);

      await component.centerElement('valid-id');

      const targetElementMid = {
        x: mockElementBounds.x + mockElementBounds.width / 2,
        y: mockElementBounds.y + mockElementBounds.height / 2,
      };

      const targetViewbox = {
        x: targetElementMid.x - mockViewbox.width / 2,
        y: targetElementMid.y - mockViewbox.height / 2,
        width: mockViewbox.width,
        height: mockViewbox.height,
      };

      expect(DiagramAnimationUtil.animatePan).toHaveBeenCalledWith(mockCanvas, mockViewbox, targetViewbox, 500);

      expect(DiagramAnimationUtil.animateZoom).toHaveBeenCalledWith(mockCanvas, 1, 500);
    });

    it('should not center element if the invalid activity id is provided', async () => {
      const mockElementBounds = { x: 100, y: 200, width: 50, height: 50 };
      const mockViewbox = { x: 0, y: 0, width: 500, height: 500 };
      mockElementRegistry.get.mockReturnValue(mockElementBounds);
      mockCanvas.viewbox.mockReturnValue(mockViewbox);
      mockCanvas.zoom.mockReturnValue(2);

      await component.centerElement('');

      expect(DiagramAnimationUtil.animatePan).not.toHaveBeenCalled();
      expect(DiagramAnimationUtil.animateZoom).not.toHaveBeenCalled();
    });

    it('should not center element if the provided activity is not found', async () => {
      const mockViewbox = { x: 0, y: 0, width: 500, height: 500 };
      mockElementRegistry.get.mockReturnValue(undefined);
      mockCanvas.viewbox.mockReturnValue(mockViewbox);
      mockCanvas.zoom.mockReturnValue(2);

      await component.centerElement('valid-id');

      expect(DiagramAnimationUtil.animatePan).not.toHaveBeenCalled();
      expect(DiagramAnimationUtil.animateZoom).not.toHaveBeenCalled();
    });

    it('should not animate zoom if the canvas is already at the target zoom level', async () => {
      const mockElementBounds = { x: 100, y: 200, width: 50, height: 50 };
      const mockViewbox = { x: 0, y: 0, width: 500, height: 500 };
      mockElementRegistry.get.mockReturnValue(mockElementBounds);
      mockCanvas.viewbox.mockReturnValue(mockViewbox);
      mockCanvas.zoom.mockReturnValue(1);

      await component.centerElement('valid-id');

      expect(DiagramAnimationUtil.animateZoom).not.toHaveBeenCalled();
    });
  });

  describe('handleTabFilterUpdate', () => {
    let spyUpdateQueryParams: Mock;
    let spySuper: Mock;

    beforeEach(() => {
      spyUpdateQueryParams = vi.spyOn(component, 'updateQueryParams');
      spySuper = vi.spyOn(ItemDetailPageComponent.prototype, 'handleTabFilterUpdate');
    });

    it('should use filter.activityId when present', () => {
      const filter = { activityId: 'act1' };
      const tabAndFilter = { tab: PimTab.Instances, filter };
      component.handleTabFilterUpdate(tabAndFilter);
      expect(spyUpdateQueryParams).toHaveBeenCalledWith({
        activityId: 'act1',
        filteredActivityId: 'act1',
      });
      expect(spySuper).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should use first element of filter.activityIdIn when activityId missing', () => {
      const filter = { activityIdIn: ['act2'] };
      const tabAndFilter = { tab: PimTab.Instances, filter };
      component.handleTabFilterUpdate(tabAndFilter);
      expect(spyUpdateQueryParams).toHaveBeenCalledWith({
        activityId: 'act2',
        filteredActivityId: 'act2',
      });
      expect(spySuper).toHaveBeenCalledWith(tabAndFilter);
    });
  });

  describe('tabHasActivityFilter', () => {
    it('should return false for Instances', () => {
      expect(component.tabHasActivityFilter(PimTab.Instances)).toBe(false);
    });

    it('should return true for anything but Instances', () => {
      expect(component.tabHasActivityFilter(PimTab.Incidents)).toBe(true);
      expect(component.tabHasActivityFilter(PimTab.JobDefinitions)).toBe(true);
      expect(component.tabHasActivityFilter(PimTab.CalledProcessDefinitions)).toBe(true);
      expect(component.tabHasActivityFilter(PimTab.DecisionInstances)).toBe(true);
    });
  });

  it('should handle a canvas size change', async () => {
    component.diagramComponent = {
      notifyCanvasSizeChanged: vi.fn(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onCanvasSizeChanged();

    expect(component.diagramComponent.notifyCanvasSizeChanged).toHaveBeenCalled();
  });

  describe('Heatmap', () => {
    let mockElementRef: ElementRef;
    const mockNavigatedViewer = MockViewerService.getNavigatedViewer();
    const mockDiagramOverlaysUtil = {
      diagramEventBus: {
        on: vi.fn(),
      },
      canvas: {
        viewbox: vi.fn().mockReturnValue({ x: 0, y: 0, scale: 1, width: 800, height: 600 }),
      },
    } as any;

    beforeEach(() => {
      mockElementRef = new ElementRef(document.createElement('div'));

      component.diagramOverlaysUtil = mockDiagramOverlaysUtil;
      component.diagramComponent = {
        navigatedViewer: mockNavigatedViewer,
      } as unknown as GenericDiagramSectionViewComponent;
    });

    describe('convertTimelineToFilter', () => {
      it('should return correct filter given specific timeline', () => {
        expect(component.convertTimelineToFilter('pastDay')).toBe(
          moment().subtract(1, 'day').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );
        expect(component.convertTimelineToFilter('pastWeek')).toBe(
          moment().subtract(1, 'week').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );
        expect(component.convertTimelineToFilter('pastMonth')).toBe(
          moment().subtract(1, 'month').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );
        expect(component.convertTimelineToFilter('pastQuarter')).toBe(
          moment().subtract(3, 'months').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );
        expect(component.convertTimelineToFilter('pastYear')).toBe(
          moment().subtract(1, 'year').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );

        // Should default to a month if unrecognized value is provided
        expect(component.convertTimelineToFilter('')).toBe(
          moment().subtract(1, 'month').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
        );
      });
    });

    describe('initHeatmap', () => {
      it('should initialize the heatmap with correct configuration', () => {
        component.initHeatmap(mockElementRef);

        expect(component.heatmapInstance).toBeDefined();
        expect(component.diagramOverlaysUtil?.diagramEventBus?.on).toHaveBeenCalledTimes(2);
        expect(component.diagramOverlaysUtil?.diagramEventBus?.on).toHaveBeenCalledWith(
          'canvas.viewbox.changed',
          expect.any(Function),
        );
        expect(component.diagramOverlaysUtil?.diagramEventBus?.on).toHaveBeenCalledWith(
          'canvas.resized',
          expect.any(Function),
        );
      });

      it('should throw error if canvas element is not defined', () => {
        expect(() => component.initHeatmap(undefined)).toThrow(
          'Could not initialize heatmap because canvas element is not yet defined.',
        );
      });

      it('should fetch heatmap history on first use and settings change', async () => {
        component.eventBus.heatmapParams({ active: true });
        await vi.runAllTimersAsync();
        expect(mockDefinitionService.getActivityInstanceHistory).toHaveBeenCalledWith(
          'itemId123',
          false,
          moment().subtract(1, 'month').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
          'startTime',
          'desc',
        );

        component.eventBus.heatmapParams({ active: true, timeline: 'pastWeek', viewBy: 'duration' });
        await vi.runAllTimersAsync();
        expect(mockDefinitionService.getActivityInstanceHistory).toHaveBeenCalledWith(
          'itemId123',
          false,
          moment().subtract(7, 'days').startOf('day').format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT),
          'startTime',
          'desc',
        );
      });
    });

    describe('createHeatmap', () => {
      beforeEach(() => {
        component.initHeatmap(mockElementRef);
        vi.spyOn(component.heatmapInstance, 'clear');
        vi.spyOn(component.heatmapInstance, 'setTranslate');
        vi.spyOn(component.heatmapInstance, 'setZoom');
        vi.spyOn(component.heatmapInstance, 'setSize');
        component.diagramRendered = true;
      });

      // This test is flaky and needs to be rewritten, skipping for now.
      it.skip('should create heatmap with provided data and params', async () => {
        const heatmapData: HeatmapData = { averageDuration: {}, count: {} };
        const heatmapParams: HeatmapParams = { active: true };
        const cleanupTooltipSpy = vi.spyOn(HeatmapUtil, 'cleanupHeatmapTooltip').mockImplementation(vi.fn());
        const renderHeatmapSpy = vi.spyOn(HeatmapUtil, 'renderHeatmap').mockImplementation((input) => input);

        // Need to flush timers once, then flush again for the timers
        // created in the first flush. This prevents condition where heatmap params
        // are overwritten by a delayed subscription callback.
        await vi.runAllTimersAsync();
        await vi.runAllTimersAsync();
        component.createHeatmap(heatmapData, heatmapParams);

        expect(component.heatmapInstance.clear).toHaveBeenCalled();
        expect(component.initialViewbox).toBeDefined();
        expect(component.activeHeatmapParams).toEqual(heatmapParams);

        await vi.runAllTimersAsync();

        expect(component.activeHeatmapData).toEqual(heatmapData);
        expect(cleanupTooltipSpy).toHaveBeenCalled();
        expect(renderHeatmapSpy).toHaveBeenCalledWith(
          component.heatmapInstance,
          heatmapData,
          heatmapParams,
          component.diagramComponent?.navigatedViewer,
        );
      });

      it('should not create heatmap if diagram is not rendered', () => {
        component.diagramRendered = false;
        const renderHeatmapSpy = vi.spyOn(HeatmapUtil, 'renderHeatmap').mockImplementation((input) => input);

        const heatmapData: HeatmapData = { averageDuration: {}, count: {} };
        const heatmapParams: HeatmapParams = { active: true };

        component.createHeatmap(heatmapData, heatmapParams);

        expect(component.heatmapInstance.clear).not.toHaveBeenCalled();
        expect(renderHeatmapSpy).not.toHaveBeenCalled();
      });
    });

    describe('destroyHeatmap', () => {
      beforeEach(() => {
        component.initHeatmap(mockElementRef);
      });

      it('should destroy heatmap and reset properties', async () => {
        const cleanupTooltipSpy = vi.spyOn(HeatmapUtil, 'cleanupHeatmapTooltip').mockImplementation(vi.fn());
        component.initialViewbox = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
        component.activeHeatmapParams = { active: true };
        component.activeHeatmapData = { averageDuration: {}, count: {} };

        component.destroyHeatmap();

        expect(component.initialViewbox).toBeUndefined();
        expect(component.activeHeatmapParams).toBeUndefined();
        await vi.runAllTimersAsync();
        expect(component.activeHeatmapData).toBeUndefined();
        expect(cleanupTooltipSpy).toHaveBeenCalledWith(component.diagramComponent?.navigatedViewer);
      });
    });

    describe('updateHeatmapTransform', () => {
      beforeEach(() => {
        component.initHeatmap(mockElementRef);
        component.initialViewbox = { x: 0, y: 0, scale: 1, width: 800, height: 600 };

        vi.spyOn(component.heatmapInstance, 'setTranslate');
        vi.spyOn(component.heatmapInstance, 'setZoom');
        vi.spyOn(component.heatmapInstance, 'setSize');
        vi.spyOn(component.heatmapInstance, 'render');
      });

      it('should update heatmap transform based on viewbox change', () => {
        const newViewbox = { x: 100, y: 100, scale: 2, width: 800, height: 600 };

        component.updateHeatmapTransform(newViewbox);

        expect(component.heatmapInstance.setTranslate).toHaveBeenCalled();
        expect(component.heatmapInstance.setZoom).toHaveBeenCalledWith(0.5);
        expect(component.heatmapInstance.setSize).toHaveBeenCalledWith(50);
        expect(component.heatmapInstance.render).toHaveBeenCalled();
      });

      it('should not update transform if initialViewbox is not defined', () => {
        component.initialViewbox = undefined;

        component.updateHeatmapTransform({ x: 100, y: 100, scale: 2, width: 800, height: 600 });

        expect(component.heatmapInstance.setTranslate).not.toHaveBeenCalled();
        expect(component.heatmapInstance.setZoom).not.toHaveBeenCalled();
        expect(component.heatmapInstance.setSize).not.toHaveBeenCalled();
        expect(component.heatmapInstance.render).not.toHaveBeenCalled();
      });
    });

    describe('canvas events', () => {
      let viewboxChangedHandler: any;
      let canvasResizedHandler: any;

      beforeEach(() => {
        component.diagramOverlaysUtil?.diagramEventBus?.on.mockImplementation((event: string, handler: any) => {
          if (event === 'canvas.viewbox.changed') viewboxChangedHandler = handler;
          if (event === 'canvas.resized') canvasResizedHandler = handler;
        });

        component.initHeatmap(mockElementRef);

        vi.spyOn(component, 'updateHeatmapTransform');
        vi.spyOn(component, 'createHeatmap');
        component.heatmapInstance.render = vi.fn();
        component.heatmapInstance.resize = vi.fn();
      });

      it('should call updateHeatmapTransform when viewbox changes', () => {
        component.initialViewbox = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
        const newViewbox = { x: 100, y: 100, scale: 2, width: 800, height: 600 };

        viewboxChangedHandler({ viewbox: newViewbox });

        expect(component.updateHeatmapTransform).toHaveBeenCalledWith(newViewbox);
        expect(component.heatmapInstance.render).toHaveBeenCalled();
      });

      it('should not call updateHeatmapTransform if initialViewbox is not defined', () => {
        component.initialViewbox = undefined;

        viewboxChangedHandler({ viewbox: { x: 100, y: 100, scale: 2, width: 800, height: 600 } });

        expect(component.updateHeatmapTransform).not.toHaveBeenCalled();
        expect(component.heatmapInstance.render).not.toHaveBeenCalled();
      });

      it('should call resize and recreate heatmap when canvas is resized', () => {
        component.initialViewbox = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
        component.activeHeatmapData = { averageDuration: {}, count: {} };
        component.activeHeatmapParams = { active: true };
        vi.useFakeTimers();

        canvasResizedHandler();

        expect(component.heatmapInstance.resize).toHaveBeenCalled();
        vi.advanceTimersByTime(component['HEATMAP_RENDER_DELAY'] + 10);
        expect(component.createHeatmap).toHaveBeenCalledWith(
          component.activeHeatmapData,
          component.activeHeatmapParams,
        );
        vi.useRealTimers();
      });
    });

    describe('getStructuredHeatmapData', () => {
      it('should return empty data when heatmapHistory is undefined', () => {
        component.heatmapHistory = undefined;

        const result = component.getStructuredHeatmapData();

        expect(result).toEqual({ averageDuration: {}, count: {} });
      });

      it('should return empty data when heatmapHistory is empty', () => {
        component.heatmapHistory = [];

        const result = component.getStructuredHeatmapData();

        expect(result).toEqual({ averageDuration: {}, count: {} });
      });

      it('should skip instances without activityId', () => {
        component.heatmapHistory = [
          { id: '1', activityId: undefined, startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00' },
          { id: '2', activityId: 'activity1', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00' },
        ] as ActivityInstanceHistory[];

        const result = component.getStructuredHeatmapData();

        expect(result.count).toEqual({ activity1: 1 });
        expect(result.averageDuration).toEqual({ activity1: 3600000 }); // 1 hour in milliseconds
      });

      it('should calculate average duration and count for single activity', () => {
        component.heatmapHistory = [
          { id: '1', activityId: 'activity1', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00' },
          { id: '2', activityId: 'activity1', startTime: '2024-01-01T12:00:00', endTime: '2024-01-01T14:00:00' },
        ] as ActivityInstanceHistory[];

        const result = component.getStructuredHeatmapData();

        expect(result.count).toEqual({ activity1: 2 });
        // Average of 1 hour (3600000ms) and 2 hours (7200000ms) = 1.5 hours (5400000ms)
        expect(result.averageDuration).toEqual({ activity1: 5400000 });
      });

      it('should calculate average duration and count for multiple activities', () => {
        component.heatmapHistory = [
          { id: '1', activityId: 'activity1', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00' },
          { id: '2', activityId: 'activity2', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T10:30:00' },
          { id: '3', activityId: 'activity1', startTime: '2024-01-01T12:00:00', endTime: '2024-01-01T14:00:00' },
        ] as ActivityInstanceHistory[];

        const result = component.getStructuredHeatmapData();

        expect(result.count).toEqual({ activity1: 2, activity2: 1 });
        expect(result.averageDuration).toEqual({
          activity1: 5400000, // Average of 1 hour and 2 hours
          activity2: 1800000, // 30 minutes
        });
      });

      it('should use current time for endTime when endTime is not provided', () => {
        const now = Date.now();
        vi.spyOn(Date, 'now').mockReturnValue(now);
        const startTime = new Date(now - 3600000).toISOString(); // 1 hour ago

        component.heatmapHistory = [
          { id: '1', activityId: 'activity1', startTime, endTime: undefined },
        ] as ActivityInstanceHistory[];

        const result = component.getStructuredHeatmapData();

        expect(result.count).toEqual({ activity1: 1 });
        expect(result.averageDuration.activity1).toBeCloseTo(3600000, -2); // Close to 1 hour
      });

      it('should handle instances without startTime', () => {
        component.heatmapHistory = [
          { id: '1', activityId: 'activity1', startTime: undefined, endTime: '2024-01-01T11:00:00' },
          { id: '2', activityId: 'activity1', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00' },
        ] as ActivityInstanceHistory[];

        const result = component.getStructuredHeatmapData();

        expect(result.count).toEqual({ activity1: 2 });
        // First instance has 0 duration, second has 1 hour, average is 0.5 hours
        expect(result.averageDuration).toEqual({ activity1: 1800000 });
      });
    });

    describe('showNoHistoryOverlay', () => {
      it('should return false when activeHeatmapData is undefined', () => {
        component.activeHeatmapData = undefined;

        expect(component.showNoHistoryOverlay).toBe(false);
      });

      it('should return false when activeHeatmapData has data', () => {
        component.activeHeatmapData = {
          averageDuration: { activity1: 1000 },
          count: { activity1: 5 },
        };

        expect(component.showNoHistoryOverlay).toBe(false);
      });

      it('should return true when activeHeatmapData is defined but has no data', () => {
        component.activeHeatmapData = {
          averageDuration: {},
          count: {},
        };

        expect(component.showNoHistoryOverlay).toBe(true);
      });
    });

    describe('onDiagramSectionClick', () => {
      it('should deactivate heatmap when heatmapInstance exists and showNoHistoryOverlay is true', () => {
        component.initHeatmap(mockElementRef);
        component.activeHeatmapData = { averageDuration: {}, count: {} };
        const heatmapParamsSpy = vi.spyOn(component.eventBus, 'heatmapParams');

        component.onDiagramSectionClick();

        expect(heatmapParamsSpy).toHaveBeenCalledWith({ active: false });
      });

      it('should not deactivate heatmap when heatmapInstance does not exist', () => {
        component.heatmapInstance = undefined;
        component.activeHeatmapData = { averageDuration: {}, count: {} };
        const heatmapParamsSpy = vi.spyOn(component.eventBus, 'heatmapParams');

        component.onDiagramSectionClick();

        expect(heatmapParamsSpy).not.toHaveBeenCalled();
      });

      it('should not deactivate heatmap when showNoHistoryOverlay is false', () => {
        component.initHeatmap(mockElementRef);
        component.activeHeatmapData = { averageDuration: { activity1: 1000 }, count: { activity1: 5 } };
        const heatmapParamsSpy = vi.spyOn(component.eventBus, 'heatmapParams');

        component.onDiagramSectionClick();

        expect(heatmapParamsSpy).not.toHaveBeenCalled();
      });
    });
  });
});
