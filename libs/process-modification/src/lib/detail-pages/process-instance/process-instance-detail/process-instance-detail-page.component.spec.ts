/* eslint-disable max-lines */
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, lastValueFrom, Observable, of, Subject } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import {
  ActivityInstance,
  ActivityInstanceHistory,
  CompleteActivityInstanceInfo,
  Incident,
  ProcessInstanceFullHistory,
  ProcessInstanceStatesMap,
  TransitionInstance,
} from '@fxn/types';
import { MockViewerService } from '@fxn/test-support/vitest';
import NavigatedViewer from 'bpmn-js/lib/Viewer';
import { MODAL_DEFAULTS } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DiagramOverlaysUtil } from '../../diagram-section/diagram-overlays-util';
import { JobService } from '../../../services/job.service';
import { CalledProcessInstancesService } from '../../../services/called-process-instances.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { ToolbarComponent, ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { IncidentService } from '../../../services/incident.service';
import { UserTaskService } from '../../../services/user-task.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimCommandStackService } from '../../diagram-section/pim-command-stack.service';
import { ContextMenuComponent } from '../../diagram-section/context-menu/context-menu.component';
import { DeploymentResourceUtilsService } from '../../../services/deployment-resource-utils.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import {
  ContextMenuItemAction,
  ContextMenuItemService,
} from '../../diagram-section/context-menu/context-menu-item.service';
import { VariableService } from '../../../services/variable.service';
import { FinishedProcessInstanceTabs, PimTab, ProcessInstanceTabs } from '../../item-detail-tab-utils';
import { GenericDiagramSectionViewComponent } from '../../../common/diagram/generic-diagram-viewer.component';
import { ActivityMarkers } from '../../diagram.mixin';
import { DiagramAnimationUtil } from '../../diagram-section/diagram-animation-util';
import { ApplyChangesModalService } from '../../diagram-section/apply-changes-modal/apply-changes-modal-service';
import { ProcessInstanceDetailPageComponent } from './process-instance-detail-page.component';

const instanceId = 'instanceId123';

const mockOverlaysUtil = {
  addTokenToDiagram: vi.fn(),
  addIncidentTokenToDiagram: vi.fn(),
  colorFlows: vi.fn(),
  canvas: {
    addMarker: vi.fn(),
    removeMarker: vi.fn(),
  },
  removeAllTokenOverlays: vi.fn(),
  diagramEventBus: {
    on: vi.fn(),
  },
  highlightActivityId: vi.fn(),
  overlayTokenOnShape: vi.fn(),
  selectionService: {
    select: vi.fn(),
  },
  elementRegistry: {
    get: vi.fn(() => ({ type: 'anElementType' })),
  },
  updateDiagramOpacity: vi.fn(),
} as unknown as DiagramOverlaysUtil;

vi.mock('../../diagram-section/diagram-overlays-util', () => ({
  DiagramOverlaysUtil: {
    getInstance: () => mockOverlaysUtil,
  },
}));

describe('Process Instance Detail Page Component', () => {
  let component: ProcessInstanceDetailPageComponent;
  let fixture: ComponentFixture<ProcessInstanceDetailPageComponent>;

  const mockJobService = {
    getJobCountByFilter: vi.fn(() => of(1)),
  } as unknown as Mocked<JobService>;

  const mockUserTaskService = {
    getUserTaskCountByFilter: vi.fn(() => of(1)),
  } as unknown as Mocked<UserTaskService>;

  const mockStaticCalledProcessInstancesService = {
    getRowDataList: vi.fn(() => of([])),
    getCalledProcessInstanceCount: vi.fn(() => of(1)),
  } as unknown as Mocked<CalledProcessInstancesService>;

  const mockInstanceService = {
    getFullHistory: vi.fn(() => of({} as ProcessInstanceFullHistory)),
    getFullHistoryCount: vi.fn(() => of(5)),
    suspendOrActivate: vi.fn().mockReturnValue(of({})),
    terminate: vi.fn().mockReturnValue(of({})),
    getProcessInstancesByFilter: vi.fn(() =>
      of([
        {
          processDefinitionId: 'defId',
          state: 'ACTIVE',
        },
      ]),
    ),
    getActivityInstances: vi.fn(() =>
      of({
        active: [{ id: 'activityInstanceId', activityId: 'Empty_Task', incidents: incidentsStub }],
        historical: history,
      }),
    ),
    getProcessInstance: vi.fn(
      () =>
        of({
          state: ProcessInstanceStatesMap.ACTIVE.value,
          processDefinitionId: '123abc',
        }) as Observable<unknown>,
    ),
  };

  const mockDecisionInstanceService: Mocked<DecisionInstanceService> = {
    getInstancesCount: vi.fn(() => of(1)),
  } as unknown as Mocked<DecisionInstanceService>;

  const mockVariablesService = {
    getProcessVariableCountByFilter: vi.fn(() => of(42)),
  };

  const snapshot = {
    data: {
      itemType: 'ProcessInstance',
      itemTypeListName: 'Mock List Name',
      itemTypeName: 'Mock Type Name',
      itemTypeClass: 'mock-type-class',
    },
    params: { id: instanceId, tenant: 'test-tenant-id' },
    queryParams: {
      tab: 'jobs',
      filteredActivityId: '',
    },
  };

  const mockRoute = {
    snapshot,
    params: of({ id: instanceId }),
  };
  const mockRouter: Mocked<Router> = {
    navigate: vi.fn().mockImplementation((commands, extras) => {
      mockRoute.snapshot = {
        ...snapshot,
        queryParams: extras.queryParams,
      };
    }),
  } as unknown as Mocked<Router>;

  const mockToolbar: Mocked<ToolbarComponent> = {
    show: vi.fn(),
    hide: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    updateButtonStates: vi.fn(),
  } as unknown as Mocked<ToolbarComponent>;

  const mockToolbarService: Mocked<ToolbarService> = {
    emitter: new EventEmitter<ToolbarEvent>(),
  } as unknown as Mocked<ToolbarService>;

  const mockConfirmActionService = {
    suspendOrActivateInstance: vi.fn(),
    terminateInstance: vi.fn(),
  };

  const mockIncidentService = {
    getIncidentCountByFilter: vi.fn(() => of(1)),
  } as unknown as IncidentService;

  const mockCommandStack = {
    add: vi.fn(),
    clear: vi.fn(),
    isEmpty$: new BehaviorSubject<boolean>(true),
    isApplyingChanges$: new BehaviorSubject<boolean>(false),
    wasStackAppliedSuccessfully$: new BehaviorSubject<boolean>(false),
    willActionsTerminateProcess: vi.fn(() => false),
    execute: vi.fn(),
  } as unknown as Mocked<PimCommandStackService>;
  const incidentsStub = [
    {
      id: 'anIncidentId',
      processDefinitionId: 'aProcDefId',
      processInstanceId: 'aProcInstId',
      executionId: 'anExecutionId',
      createTime: '2014-03-01T08:00:00.000+0200',
      endTime: '',
      incidentType: 'failedJob',
      activityId: 'Empty_Task',
      failedActivityId: 'Empty_Task',
      causeIncidentId: 'aCauseIncidentId',
      rootCauseIncidentId: 'aRootCauseIncidentId',
      configuration: 'aConfiguration',
      incidentMessage: 'anIncidentMessage',
      jobDefinitionId: 'aJobDefinitionId',
      open: true,
      deleted: false,
      resolved: false,
      rootProcessInstanceId: 'aRootProcessInstanceId',
    },
    {
      id: 'anotherIncidentId',
      processDefinitionId: 'aProcDefId',
      processInstanceId: 'aProcInstId',
      executionId: 'anExecutionId',
      createTime: '2014-03-01T08:00:00.000+0200',
      endTime: '',
      incidentType: 'failedJob',
      activityId: 'alternate_task',
      failedActivityId: 'alternate_task',
      causeIncidentId: 'aCauseIncidentId',
      rootCauseIncidentId: 'aRootCauseIncidentId',
      configuration: 'aConfiguration',
      incidentMessage: 'anIncidentMessage',
      jobDefinitionId: 'aJobDefinitionId',
      open: true,
      deleted: false,
      resolved: false,
      rootProcessInstanceId: 'aRootProcessInstanceId',
    },
  ] as Incident[];

  const history = [
    {
      activityId: 'Empty_Task',
      activityName: 'anActivityName',
      activityType: 'userTask',
      assignee: 'peter',
      calledProcessInstanceId: 'aHistoricCalledProcessInstanceId',
      canceled: false,
      completeScope: false,
      durationInMillis: 2000,
      endTime: '2013-04-23T18:42:43.000+0200',
      executionId: 'anExecutionId',
      id: 'aHistoricActivityInstanceId',
      parentActivityInstanceId: 'aHistoricParentActivityInstanceId',
      processDefinitionId: 'aProcDefId',
      processInstanceId: 'aProcInstId',
      startTime: '2013-04-23T11:20:43.000+0200',
      taskId: 'aTaskId',
      removalTime: '2018-02-10T14:33:19.000+0200',
      rootProcessInstanceId: 'aRootProcessInstanceId',
    } as ActivityInstanceHistory,
  ];

  const mockContextMenuItemService = {
    getProcessInstanceMenuItems: vi.fn(() => []),
    elementHasActiveInstance: vi.fn(),
  };

  const mockContextMenu = {
    init: vi.fn(() => ({ pipe: () => ({ subscribe: () => undefined }) })),
    close: vi.fn(),
    open: vi.fn(),
    itemClickEvent: new EventEmitter(),
  } as unknown as ContextMenuComponent;

  const mockResourceUtilsService: Mocked<DeploymentResourceUtilsService> = {
    downloadDiagramResource: vi.fn(),
  } as unknown as Mocked<DeploymentResourceUtilsService>;

  const mockApplyChangesModalService: Mocked<ApplyChangesModalService> = {
    show: vi.fn(() => Promise.resolve({ confirmed: true, clearChanges: false })),
    close: vi.fn(),
  } as unknown as Mocked<ApplyChangesModalService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserModule],
      declarations: [ProcessInstanceDetailPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: IncidentService, useValue: mockIncidentService },
        { provide: ToolbarService, useValue: mockToolbarService },
        { provide: ProcessInstanceService, useValue: mockInstanceService },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        { provide: DecisionInstanceService, useValue: mockDecisionInstanceService },
        { provide: UserTaskService, useValue: mockUserTaskService },
        ItemDetailPageCommunicationService,
        {
          provide: CalledProcessInstancesService,
          useValue: mockStaticCalledProcessInstancesService,
        },
        ItemDetailPageCommunicationService,
        { provide: PimCommandStackService, useValue: mockCommandStack },
        { provide: ContextMenuItemService, useValue: mockContextMenuItemService },
        { provide: VariableService, useValue: mockVariablesService },
        { provide: JobService, useValue: mockJobService },
        { provide: DeploymentResourceUtilsService, useValue: mockResourceUtilsService },
        { provide: ApplyChangesModalService, useValue: mockApplyChangesModalService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProcessInstanceDetailPageComponent);
    component = fixture.componentInstance;
    component.toolbar = mockToolbar;
    component.queryParams$ = of({ tab: 'incidents' });
    component.updateQueryParams({ tab: 'jobs' });

    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set observables for is item found and tabs on init', async () => {
    component.ngOnInit();
    await expect(lastValueFrom(component.isItemFound$ as any)).resolves.toEqual(true);
    expect(component.tabs).toEqual(ProcessInstanceTabs);
  });

  it('should set observables for tab counts on set up tabs', async () => {
    component.ngOnInit();
    await vi.runAllTimersAsync();

    expect(component.counts).toEqual({
      [PimTab.DecisionInstances]: 1,
      [PimTab.Incidents]: 1,
      [PimTab.CalledProcessInstances]: 1,
      [PimTab.History]: 5,
      [PimTab.Variables]: 42,
      [PimTab.JobDefinitions]: 0,
      [PimTab.Jobs]: 1,
      [PimTab.UserTasks]: 1,
    });
  });

  describe('should update tab counts on demand', () => {
    beforeEach(() => {
      component.ngOnInit();

      // Reset counts object so we can test we can validate that they get set to the expected values after the tabs' counts get updated
      Object.keys(component.counts).forEach((k) => {
        component.counts[k] = 0;
      });
    });

    it('for Variables tab', () => {
      const filter = { processInstanceIdIn: [instanceId] };

      expect(component.counts[PimTab.Variables]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.Variables, filter });

      expect(mockVariablesService.getProcessVariableCountByFilter).toHaveBeenCalledWith(filter, component.isUnfinished);
      expect(component.counts[PimTab.Variables]).toEqual(42);
    });

    it('for Incidents tab', () => {
      const filter = { processInstanceIdIn: [instanceId] };

      expect(component.counts[PimTab.Incidents]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.Incidents, filter });

      expect(mockIncidentService.getIncidentCountByFilter).toHaveBeenCalledWith(filter);
      expect(component.counts[PimTab.Incidents]).toEqual(1);
    });

    it('for JobDefinitions tab', () => {
      const filter = { processInstanceIdIn: [instanceId] };

      expect(component.counts[PimTab.JobDefinitions]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.JobDefinitions, filter });

      expect(mockJobService.getJobCountByFilter).toHaveBeenCalledWith(filter);
      expect(component.counts[PimTab.JobDefinitions]).toEqual(1);
    });

    it('for Decision Instance Count tab', () => {
      const filter = { processInstanceIdIn: [instanceId] };

      expect(component.counts[PimTab.DecisionInstances]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.DecisionInstances, filter });

      expect(mockDecisionInstanceService.getInstancesCount).toHaveBeenCalledWith(filter);
      expect(component.counts[PimTab.DecisionInstances]).toEqual(1);
    });
    it('for Called Process Instances tab', () => {
      const filter = { processInstanceIdIn: [instanceId] };

      expect(component.counts[PimTab.CalledProcessInstances]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.CalledProcessInstances, filter });

      expect(mockStaticCalledProcessInstancesService.getCalledProcessInstanceCount).toHaveBeenCalledWith(filter);
      expect(component.counts[PimTab.CalledProcessInstances]).toEqual(1);
    });

    it('for history tab', () => {
      const filter = {
        typeFilters: [],
        isLoadAll: false,
      };
      expect(component.counts[PimTab.History]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.History, filter });

      expect(mockInstanceService.getFullHistoryCount).toHaveBeenCalledWith(
        'instanceId123',
        filter.typeFilters,
        filter.isLoadAll,
      );
      expect(component.counts[PimTab.History]).toEqual(5);
    });

    it('for jobs tab', () => {
      const filter = {
        processInstanceId: 'instanceId123',
      };
      expect(component.counts[PimTab.Jobs]).toEqual(0);

      component.updateCountForTab({ tab: PimTab.Jobs, filter });

      expect(mockJobService.getJobCountByFilter).toHaveBeenCalledWith(filter);
      expect(component.counts[PimTab.Jobs]).toEqual(1);
    });
  });

  it('should call the decision instance count API with process instances', async () => {
    vi.clearAllMocks();
    component.ngOnInit();

    expect(mockDecisionInstanceService.getInstancesCount).toHaveBeenCalledWith({
      processInstanceId: 'instanceId123',
    });
  });

  it('should load process instance detail page data on init', () => {
    component.ngOnInit();
    expect(mockInstanceService.getProcessInstance).toHaveBeenCalled();
  });

  it('should load process instance detail page data if items are not loaded', async () => {
    component.loadProcessInstanceDetailData(instanceId);

    await vi.runAllTimersAsync();

    expect(mockInstanceService.getProcessInstance).toHaveBeenCalledWith(instanceId);
    expect(mockInstanceService.getActivityInstances).toHaveBeenCalledWith(instanceId);
    expect(component.activeActivityInstance).toBeDefined();
    expect(component.history).toBeDefined();
  });

  it('should set isItemFound$ to false when process instance is not found', async () => {
    mockInstanceService.getProcessInstance.mockReturnValueOnce(of(undefined));

    component.loadProcessInstanceDetailData(instanceId);

    await expect(lastValueFrom(component.isItemFound$ as Observable<boolean>)).resolves.toEqual(false);
  });

  it('should handle button click events from the toolbar service emitter', () => {
    const event = { target: 'activate', action: 'click' };

    component.onToolbarButtonClick = vi.fn();
    component.itemId$ = of(instanceId);
    component.queryParams$ = of({ tab: 'incidents' });
    fixture.detectChanges();
    component.ngOnInit();

    mockToolbarService.emitter.emit(event);

    expect(component.onToolbarButtonClick).toHaveBeenCalledWith(event);
  });

  describe('on activate button click', () => {
    it('should call suspendOrActivate', () => {
      const event = { target: 'activate', action: 'click' };

      component.ngOnInit();

      mockToolbarService.emitter.emit(event);

      expect(mockConfirmActionService.suspendOrActivateInstance).toHaveBeenCalledWith(
        snapshot.params.tenant,
        [instanceId],
        false,
      );
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'activate', action: 'click' };

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => of({ canceled: true }));

      await component.onToolbarButtonClick(event);

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledTimes(0);
    });

    it('should refresh the data on success', async () => {
      component.ngOnInit();
      const event = { target: 'activate', action: 'click' };

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => Promise.resolve(of(null)));

      component.onToolbarButtonClick(event);
      await vi.runAllTimersAsync();

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledWith(instanceId);
    });
  });

  describe('on suspend button click', () => {
    it('should call suspendOrActivate', () => {
      const event = { target: 'suspend', action: 'click' };

      component.ngOnInit();

      mockToolbarService.emitter.emit(event);

      expect(mockConfirmActionService.suspendOrActivateInstance).toHaveBeenCalledWith(
        snapshot.params.tenant,
        [instanceId],
        true,
      );
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'suspend', action: 'click' };

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => of({ canceled: true }));

      await component.onToolbarButtonClick(event);

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledTimes(0);
    });

    it('should refresh the data on success', async () => {
      component.ngOnInit();
      const event = { target: 'suspend', action: 'click' };

      mockConfirmActionService.suspendOrActivateInstance.mockImplementation(() => Promise.resolve(of(null)));

      await component.onToolbarButtonClick(event);

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledWith(instanceId);
    });
  });

  describe('on terminate button click', () => {
    it('should call terminate', () => {
      const event = { target: 'terminate', action: 'click' };

      component.ngOnInit();

      mockToolbarService.emitter.emit(event);

      expect(mockConfirmActionService.terminateInstance).toHaveBeenCalledWith(snapshot.params.tenant, [instanceId]);
    });

    it('should do nothing when the action is canceled', async () => {
      const event = { target: 'terminate', action: 'click' };

      mockConfirmActionService.terminateInstance.mockImplementation(() => of({ canceled: true }));

      await component.onToolbarButtonClick(event);

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledTimes(0);
    });

    it('should refresh the data on success', async () => {
      component.ngOnInit();
      const event = { target: 'terminate', action: 'click' };

      mockConfirmActionService.terminateInstance.mockImplementation(() => Promise.resolve(of(null)));

      await component.onToolbarButtonClick(event);

      expect(mockInstanceService.getProcessInstance).toHaveBeenCalledWith(instanceId);
    });
  });

  describe('on download resource button click', () => {
    it('should call downloadResource', async () => {
      const event = { target: 'download_resource', action: 'click' };
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(1);

      mockToolbarService.emitter.emit(event);

      expect(mockResourceUtilsService.downloadDiagramResource).toHaveBeenCalledWith('123abc', '');
    });
  });

  describe('on apply changes button click', () => {
    it('given the changes would not put the process into an EXTERNALLY_TERMINATED state, should call execute on the stack when onApplyChanges is called', async () => {
      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);
      expect(mockCommandStack.execute).toHaveBeenCalledTimes(1);
    });

    it('should warn the user when changes will put instance into externally terminated state', async () => {
      mockCommandStack.willActionsTerminateProcess.mockReturnValue(true);

      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);

      expect(mockApplyChangesModalService.show).toHaveBeenCalledWith(
        { willTerminate: true },
        {
          ...MODAL_DEFAULTS,
          modalDialogClass: 'dynamic-modal',
        },
      );
    });

    it('should pass along the correct options to the execute function', async () => {
      mockApplyChangesModalService.show.mockReturnValueOnce(
        Promise.resolve({ confirmed: true, clearChanges: false, skipIoMappings: false, skipCustomListeners: true }),
      );

      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);

      expect(mockCommandStack.execute).toHaveBeenCalledWith({ skipIoMappings: false, skipCustomListeners: true });
    });

    it('confirming the changes, should call execute on the stack', async () => {
      mockCommandStack.willActionsTerminateProcess.mockReturnValue(true);

      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);

      expect(mockCommandStack.execute).toHaveBeenCalledTimes(1);
    });

    it('canceling the changes should not clear all changes nor call execute', async () => {
      mockCommandStack.willActionsTerminateProcess.mockReturnValue(true);
      mockApplyChangesModalService.show.mockReturnValue(Promise.resolve({ confirmed: false, clearChanges: false }));
      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);

      expect(mockCommandStack.clear).toHaveBeenCalledTimes(0);
      expect(mockCommandStack.execute).toHaveBeenCalledTimes(0);
    });

    it('passing clearChanges = true should clear all changes', async () => {
      mockCommandStack.willActionsTerminateProcess.mockReturnValue(true);
      mockApplyChangesModalService.show.mockReturnValue(Promise.resolve({ confirmed: false, clearChanges: true }));
      const event = { target: 'apply_changes', action: 'click' };
      await component.onToolbarButtonClick(event);

      expect(mockCommandStack.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('diagram', () => {
    it('should have event listeners for user interaction', () => {
      component.diagramComponent = {
        navigatedViewer: MockViewerService.getNavigatedViewer(),
      } as unknown as GenericDiagramSectionViewComponent;
      component.contextMenu = mockContextMenu;
      component.onDiagramRendered(true);

      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(1, 'selection.changed', expect.any(Function));
      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(
        2,
        'element.hover',
        99999,
        expect.any(Function),
      );
      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(3, 'element.click', expect.any(Function));
      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(
        4,
        'element.mouseup',
        99999,
        expect.any(Function),
      );
      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(
        5,
        'element.mousedown',
        99999,
        expect.any(Function),
      );
      expect(mockOverlaysUtil.diagramEventBus.on).toHaveBeenNthCalledWith(
        6,
        'element.contextmenu',
        99999,
        expect.any(Function),
      );
      expect(component.contextMenuSub$).toBeDefined();
    });

    it('should update query params when the selection changes', () => {
      const e = {
        newSelection: [
          {
            id: 'myId',
          },
        ],
      };
      const spy = vi.spyOn(component, 'updateQueryParams');
      component.onSelectionChanged(e);

      expect(spy).toHaveBeenCalledWith({ activityId: 'myId' });
    });

    it('should handle element hover', () => {
      const elementA = { id: 'A' };
      const elementB = { id: 'B' };

      component.diagramOverlaysUtil = {
        handleShapeEnter: vi.fn(),
        handleShapeExit: vi.fn(),
      } as unknown as DiagramOverlaysUtil;

      const event1: any = {
        element: elementA,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      component.onElementHover(event1);

      expect(event1.preventDefault).toHaveBeenCalled();
      expect(event1.stopPropagation).toHaveBeenCalled();
      expect(component.diagramOverlaysUtil.handleShapeExit).not.toHaveBeenCalled();
      expect(component.diagramOverlaysUtil.handleShapeEnter).toHaveBeenCalledWith(elementA);
      expect(component.hoveredElement).toBe(elementA);

      const event2: any = {
        element: elementB,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      component.onElementHover(event2);

      expect(event2.preventDefault).toHaveBeenCalled();
      expect(event2.stopPropagation).toHaveBeenCalled();
      expect(component.diagramOverlaysUtil.handleShapeExit).toHaveBeenCalledWith(elementA);
      expect(component.diagramOverlaysUtil.handleShapeEnter).toHaveBeenCalledWith(elementB);
      expect(component.hoveredElement).toBe(elementB);
    });

    it('should add a command to the command stack when the add token context menu item is clicked', () => {
      const target = {};
      const e: any = {
        action: ContextMenuItemAction.ADD_TOKEN,
        target,
      };
      component.onContextMenuItemClicked(e);

      expect(mockCommandStack.add).toHaveBeenCalledWith({
        type: e.action,
        target,
        processInstanceId: instanceId,
      });
    });

    it('should add a command to the command stack when the remove token context menu item is clicked', () => {
      const target = {};
      const e: any = {
        action: ContextMenuItemAction.REMOVE_TOKEN,
        target,
      };
      component.onContextMenuItemClicked(e);

      expect(mockCommandStack.add).toHaveBeenCalledWith({
        type: e.action,
        target,
        processInstanceId: instanceId,
      });
    });

    it('should overlay a token on a shape when the redo context menu item is clicked', () => {
      const target = { type: 'asdf' };
      const e: any = {
        action: ContextMenuItemAction.REDO,
        target,
        original: {
          action: ContextMenuItemAction.ADD_TOKEN,
          target,
        },
      };
      component.diagramOverlaysUtil = mockOverlaysUtil;
      component.onContextMenuItemClicked(e);

      expect(mockOverlaysUtil.overlayTokenOnShape).toHaveBeenCalledWith(e.original.action, e.original.target, false);
    });

    it('should remove all overlays from a shape when the undo context menu item is clicked', () => {
      const target = { id: 'hello' };
      const e: any = {
        action: ContextMenuItemAction.UNDO,
        target,
        original: {
          target,
        },
      };
      component.diagramOverlaysUtil = mockOverlaysUtil;
      component.onContextMenuItemClicked(e);

      expect(mockOverlaysUtil.removeAllTokenOverlays).toHaveBeenCalledWith(e.original.target.id);
    });

    it('should remove the context menu when clicking outside of the diagram', () => {
      component.contextMenu = mockContextMenu;

      component.onClickOutsideDiagram();

      expect(mockContextMenu.close).toHaveBeenCalled();
    });

    it('should close the context menu and clear the highlight', () => {
      const e = {
        element: {
          id: 'myId',
        },
      };
      const spy = vi.spyOn(component, 'clearActivityHighlight');
      component.clickedActivityId = 'asdf';
      component.contextMenu = mockContextMenu;

      component.onElementMouseUp(e);

      expect(spy).toHaveBeenCalledWith('asdf');
      expect(mockContextMenu.close).toHaveBeenCalled();
    });

    it('should display the custom context menu', () => {
      const e = {
        element: { type: 'asdf' },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        originalEvent: {
          clientX: 2,
          clientY: 2,
        },
      };
      const spy = vi.spyOn(component, 'showContextMenu');
      component.enableModificationTools = true;
      component.contextMenu = mockContextMenu;
      component.onContextMenu(e);

      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(e);
    });

    it('given the command stack is emptied, it should clear all token overlays', async () => {
      component.ngOnInit();

      component.diagramOverlaysUtil = mockOverlaysUtil;
      mockCommandStack.isEmpty$.next(true);

      await vi.runAllTimersAsync();

      expect(mockOverlaysUtil.removeAllTokenOverlays).toHaveBeenCalled();
    });

    it('should highlight the diagram if diagram is rendered on init', () => {
      const colorDiagramSpy = vi.spyOn(component, 'colorDiagram');
      component.diagramRendered = false;
      component.ngOnInit();
      expect(colorDiagramSpy).toHaveBeenCalledTimes(0);
      vi.clearAllMocks();
      component.diagramRendered = true;
      component.eventBus.diagramFlowHighlighted$.next(true);
      expect(colorDiagramSpy).toHaveBeenCalledTimes(1);
    });
    describe('onElementClick', () => {
      it('should clear the filter if the root process element is clicked', () => {
        const event = { element: { type: 'bpmn:Process', id: 'rootProcessId' } };
        const updateQueryParamsSpy = vi.spyOn(component, 'updateQueryParams');

        component.onElementClick(event);

        expect(updateQueryParamsSpy).toHaveBeenCalledWith({ activityId: undefined, filteredActivityId: undefined });
      });

      it('should clear the filter if the currently filtered activity is clicked', () => {
        const filteredId = 'activity123';
        const event = { element: { type: 'bpmn:Task', id: filteredId } };
        const updateQueryParamsSpy = vi.spyOn(component, 'updateQueryParams');
        mockRoute.snapshot.queryParams.filteredActivityId = 'activity123';

        component.onElementClick(event);

        expect(updateQueryParamsSpy).toHaveBeenCalledWith({ activityId: undefined, filteredActivityId: undefined });
      });

      it('should set the filtered activity if a new element is clicked', () => {
        const event = { element: { type: 'bpmn:Task', id: 'newActivityId' } };
        const updateQueryParamsSpy = vi.spyOn(component, 'updateQueryParams');

        component.onElementClick(event);

        expect(updateQueryParamsSpy).toHaveBeenCalledWith({
          activityId: 'newActivityId',
          filteredActivityId: 'newActivityId',
        });
      });
    });
  });

  describe('should markup the diagram,', () => {
    function expectMarkersRemoved() {
      expect(mockOverlaysUtil.canvas.removeMarker).toHaveBeenCalledWith(
        history[0].activityId,
        ActivityMarkers.CANCELED,
      );
      expect(mockOverlaysUtil.canvas.removeMarker).toHaveBeenCalledWith(
        history[0].activityId,
        ActivityMarkers.COMPLETED,
      );
      expect(mockOverlaysUtil.canvas.removeMarker).toHaveBeenCalledWith(
        history[0].activityId,
        ActivityMarkers.IN_PROGRESS,
      );
    }

    beforeEach(() => {
      component.diagramRendered = true;
      component.diagramOverlaysUtil = mockOverlaysUtil;
      component.activeActivityInstance = {
        id: 'activityInstanceId',
        activityId: 'Empty_Task',
        incidents: incidentsStub.map((incident) => ({ id: incident.id, activityId: incident.activityId ?? '' })),
      };
      component.history = [];
      component.activityInstanceInfo = {
        active: {
          childActivityInstances: [],
          childTransitionInstances: [],
        },
        historical: [],
      } as CompleteActivityInstanceInfo;
    });

    it('when there are no incidents, should not add incidents to the diagram', () => {
      component.markupDiagram();

      expect(mockOverlaysUtil.addIncidentTokenToDiagram).not.toHaveBeenCalled();
    });

    it('when there are incidents, should add incidents to the diagram', () => {
      component.incidents = [{ totalIncidents: 1, failedActivityId: 'asdf' }];

      component.markupDiagram();

      expect(mockOverlaysUtil.addIncidentTokenToDiagram).toHaveBeenCalledWith('asdf', 1);
    });

    it('should mark a shape that has been completed, then unmark when toggled', () => {
      component.history = history;
      component.diagramFlowHighlighted = true;

      component.markupDiagram();

      expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith(history[0].activityId, ActivityMarkers.COMPLETED);
      expect(mockOverlaysUtil.addTokenToDiagram).toHaveBeenCalledWith(history[0].activityId, 1, 'completed-token');
      component.diagramFlowHighlighted = false;
      component.markupDiagram();
      expectMarkersRemoved();
    });

    it('should mark a shape that is in progress, then unmark when toggled', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      component.activeActivityInstance!.childActivityInstances = [{ activityId: 'Empty_Task' }];
      component.history = [{ ...history[0], endTime: undefined }];
      component.diagramFlowHighlighted = true;

      component.markupDiagram();

      expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith(
        history[0].activityId,
        ActivityMarkers.IN_PROGRESS,
      );
      expect(mockOverlaysUtil.addTokenToDiagram).toHaveBeenCalledWith('Empty_Task', 1, 'active-token');
      component.diagramFlowHighlighted = false;
      component.markupDiagram();
      expectMarkersRemoved();
    });

    it('should mark a shape that has been canceled, then unmark when toggled', () => {
      component.history = [{ ...history[0], canceled: true }];
      component.diagramFlowHighlighted = true;

      component.markupDiagram();

      expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith(history[0].activityId, ActivityMarkers.CANCELED);
      expect(mockOverlaysUtil.addTokenToDiagram).toHaveBeenCalledWith(history[0].activityId, 1, 'terminated-token');
      component.diagramFlowHighlighted = false;
      component.markupDiagram();
      expectMarkersRemoved();
    });

    it('should highlight and unhighlight incidents', () => {
      component.incidents = [{ totalIncidents: 1, failedActivityId: '123' }];
      component.diagramFlowHighlighted = true;
      component.markupDiagram();
      expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith('123', 'incident');

      component.diagramFlowHighlighted = false;
      component.markupDiagram();
      expect(mockOverlaysUtil.canvas.removeMarker).toHaveBeenCalledWith('123', 'incident');
    });
  });

  it('should set editing when setEditing is called and call overlay util when needed', () => {
    component.diagramOverlaysUtil = mockOverlaysUtil;

    expect(component.isEditing).toEqual(false);
    component.setEditing(true);
    expect(component.diagramOverlaysUtil.selectionService.select).toHaveBeenCalledTimes(0);
    expect(component.isEditing).toEqual(true);

    component.setEditing(false);
    expect(component.diagramOverlaysUtil.selectionService.select).toHaveBeenCalledTimes(1);
  });

  it('should get tab list correctly for unfinished instance', () => {
    mockInstanceService.getProcessInstance.mockReturnValueOnce(
      of({
        processDefinitionId: 'defId',
        state: 'SUSPENDED',
      }),
    );
    component.ngOnInit();
    expect(component.tabs).toEqual(ProcessInstanceTabs);
  });

  it('should get tab list correctly for finished instance', () => {
    mockInstanceService.getProcessInstance.mockClear();
    mockInstanceService.getProcessInstance.mockReturnValue(
      of({
        processDefinitionId: 'defId',
        state: 'TERMINATED',
      }),
    );
    component.ngOnInit();
    expect(component.tabs).toEqual(FinishedProcessInstanceTabs);
  });

  it('should set diagramComponentId when it exists', () => {
    mockInstanceService.getProcessInstance.mockReturnValue(
      of({
        state: ProcessInstanceStatesMap.ACTIVE.value,
        processDefinitionId: '123abc',
      }),
    );
    component.diagramComponent = { id: '', isLoading: false } as unknown as GenericDiagramSectionViewComponent;
    component.ngOnInit();
    expect(component.diagramComponent.id).toEqual('123abc');
  });

  it('should set enableModificationTools correctly based on process instance state', () => {
    component.ngOnInit();
    expect(component.enableModificationTools).toEqual(true);

    mockInstanceService.getProcessInstance.mockReturnValue(
      of({
        processDefinitionId: 'defId',
        state: 'TERMINATED',
      }),
    );

    component.ngOnInit();
    expect(component.enableModificationTools).toEqual(false);
  });

  it('isUnfinishedInstance getter should return correctly', () => {
    mockInstanceService.getProcessInstance.mockReturnValue(
      of({
        processDefinitionId: 'defId',
        state: 'SUSPENDED',
      }),
    );

    component.ngOnInit();
    expect(component.isUnfinishedInstance).toEqual(true);
  });

  it('isUnfinishedInstance getter should return correctly', () => {
    mockInstanceService.getProcessInstance.mockReturnValue(
      of({
        processDefinitionId: 'defId',
        state: 'TERMINATED',
      }),
    );

    component.ngOnInit();
    expect(component.isUnfinishedInstance).toEqual(false);
  });

  it('should remove unnecessary query params when changing tabs', () => {
    expect(component.route.snapshot.queryParams).toEqual({ tab: 'jobs' });
    component.updateQueryParams({ jobId: '123', activityId: '456', tab: 'jobs' });
    expect(component.route.snapshot.queryParams).toEqual({ jobId: '123', activityId: '456', tab: 'jobs' });
    component.activeTabsChanged('instances');
    expect(component.route.snapshot.queryParams).toEqual({ activityId: '456', tab: 'instances' });
  });

  it('should set the sequenceArray correctly', () => {
    const sequenceFlows = [
      { sequenceId: 'sequence_1', sourceActivityId: 'activity_1', targetActivityId: 'activity_2' },
    ];
    expect(component.sequenceFlows).toEqual([]);
    component.setSequenceFlows(sequenceFlows);
    expect(component.sequenceFlows).toEqual(sequenceFlows);
  });

  it('should handle coloring sequence flow when there are no activities', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.history = [];
    component.activityInstanceInfo = {
      active: {
        childActivityInstances: [],
        childTransitionInstances: [],
      },
      historical: [],
    } as CompleteActivityInstanceInfo;
    component.diagramFlowHighlighted = false;
    component.colorSequenceFlows();
    expect(mockOverlaysUtil.colorFlows).toHaveBeenCalledWith([], false);
  });

  it('should add solid paths marker to shapes correctly', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.diagramFlowHighlighted = true;
    component.history = [
      {
        activityId: 'StartEvent_1',
        canceled: false,
        endTime: 'anEndTime',
      },
    ] as ActivityInstanceHistory[];
    component.activityInstanceInfo = {
      active: { childActivityInstances: [], childTransitionInstances: [] },
      historical: [],
    };
    component.incidents = [{ totalIncidents: 1, failedActivityId: 'asdf' }];
    component.colorDiagram();
    expect(mockOverlaysUtil.canvas.addMarker).not.toHaveBeenCalledWith('StartEvent_1', 'solid-paths');
    expect(mockOverlaysUtil.canvas.addMarker).not.toHaveBeenCalledWith('asdf', 'solid-paths');
    mockOverlaysUtil.elementRegistry.get.mockReturnValue({ type: 'Gateway' });

    component.colorDiagram();
    expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith('StartEvent_1', 'solid-paths');
    expect(mockOverlaysUtil.canvas.addMarker).toHaveBeenCalledWith('asdf', 'solid-paths');
  });

  it('should handle coloring sequence flow when there are activities', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.history = [
      {
        activityId: 'StartEvent_1',
        canceled: false,
        startTime: '2026-03-08T13:29:52.986-0400',
        endTime: '2026-03-09T13:29:52.986-0400',
      },
    ] as ActivityInstanceHistory[];
    component.sequenceFlows = [
      {
        sequenceId: 'sequence_1',
        sourceActivityId: 'StartEvent_1',
        targetActivityId: 'Activity_1',
      },
      { sequenceId: 'sequence_2', sourceActivityId: 'Activity_1', targetActivityId: 'Activity_2' },
      { sequenceId: 'sequence_3', sourceActivityId: 'Activity_2', targetActivityId: 'EndEvent_1' },
    ];
    component.activityInstanceInfo = {
      active: {
        childActivityInstances: [
          {
            activityId: 'Activity_1',
            startTime: '2026-03-10T13:29:52.986-0400',
          },
        ] as ActivityInstance[],
        childTransitionInstances: [
          {
            activityId: 'Activity_2',
          },
        ] as TransitionInstance[],
      },
      historical: [],
    } as CompleteActivityInstanceInfo;
    component.diagramFlowHighlighted = false;
    component.colorSequenceFlows();
    expect(mockOverlaysUtil.colorFlows).toHaveBeenCalledWith(
      [
        {
          id: 'sequence_1',
          element: null,
        },
      ],
      false,
    );
  });

  it('should not highlight sequence flows when source ends after target starts (loop-back)', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.history = [
      {
        activityId: 'StartEvent_1',
        canceled: false,
        startTime: '2026-03-07T13:29:52.986-0400',
        endTime: '2026-03-08T13:29:52.986-0400',
      },
      {
        activityId: 'Activity_1',
        canceled: false,
        startTime: '2026-03-09T13:29:52.986-0400',
        endTime: '2026-03-11T13:29:52.986-0400',
      },
      {
        activityId: 'Activity_2',
        canceled: false,
        startTime: '2026-03-12T13:29:52.986-0400',
        endTime: '2026-03-13T13:29:52.986-0400',
      },
    ] as ActivityInstanceHistory[];
    component.sequenceFlows = [
      {
        sequenceId: 'sequence_forward_1',
        sourceActivityId: 'StartEvent_1',
        targetActivityId: 'Activity_1',
      },
      {
        sequenceId: 'sequence_forward_2',
        sourceActivityId: 'Activity_1',
        targetActivityId: 'Activity_2',
      },
      {
        sequenceId: 'sequence_loop_back',
        sourceActivityId: 'Activity_2',
        targetActivityId: 'Activity_1',
      },
      {
        sequenceId: 'sequence_forward_3',
        sourceActivityId: 'Activity_2',
        targetActivityId: 'Activity_3',
      },
    ];
    component.activityInstanceInfo = {
      active: {
        childActivityInstances: [
          {
            activityId: 'Activity_3',
            startTime: '2026-03-20T13:29:52.986-0400',
          },
        ] as ActivityInstance[],
        childTransitionInstances: [],
      },
      historical: [] as ActivityInstanceHistory[],
    } as CompleteActivityInstanceInfo;
    component.diagramFlowHighlighted = false;
    component.colorSequenceFlows();
    // Only the forward-in-time flows should be highlighted, not the loop-back
    expect(mockOverlaysUtil.colorFlows).toHaveBeenCalledWith(
      [
        {
          id: 'sequence_forward_1',
          element: null,
        },
        {
          id: 'sequence_forward_2',
          element: null,
        },
        {
          id: 'sequence_forward_3',
          element: null,
        },
      ],
      false,
    );
  });

  it('should handle coloring sequence flow when there are exclusive gateways', () => {
    component.diagramComponent = {
      navigatedViewer: MockViewerService.getNavigatedViewer(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onDiagramRendered(true);
    component.history = [
      {
        activityId: 'StartEvent_1',
        canceled: false,
        endTime: '2025-09-10T12:00:00.000+0000',
      },
      {
        activityId: 'Gateway_1',
        canceled: false,
        endTime: '2025-09-11T12:00:00.000+0000',
      },
    ] as ActivityInstanceHistory[];
    component.sequenceFlows = [
      {
        sequenceId: 'sequence_1',
        sourceActivityId: 'StartEvent_1',
        targetActivityId: 'Gateway_1',
      },
      { sequenceId: 'sequence_2', sourceActivityId: 'Gateway_1', targetActivityId: 'Gateway_2' },
      { sequenceId: 'sequence_3', sourceActivityId: 'Gateway_2', targetActivityId: 'EndEvent_1' },
      { sequenceId: 'sequence_4', sourceActivityId: 'Gateway_1', targetActivityId: 'Task_1' },
    ];
    component.activityInstanceInfo = {
      active: {
        childActivityInstances: [
          {
            activityId: 'Gateway_1',
            activityType: 'exclusiveGateway',
            startTime: '2025-09-11T12:00:00.000+0000',
          },
          // Should not color sequence_2 as Gateway_2 started after Task_1
          {
            activityId: 'Gateway_2',
            activityType: 'exclusiveGateway',
            startTime: '2025-09-22T12:00:00.000+0000',
          },
          {
            activityId: 'Task_1',
            activityType: 'userTask',
            startTime: '2025-09-21T12:00:00.000+0000',
          },
        ] as ActivityInstance[],
      },
      historical: [],
    } as CompleteActivityInstanceInfo;
    component.diagramFlowHighlighted = false;
    component.colorSequenceFlows();
    expect(mockOverlaysUtil.colorFlows).toHaveBeenCalledWith(
      [
        {
          id: 'sequence_1',
          element: null,
        },
        {
          id: 'sequence_4',
          element: null,
        },
      ],
      false,
    );
  });

  it('should replace activityId value with value of pseudoId #multiInstanceBody', () => {
    const activityObj = {
      activity1: {
        id: 'activity1',
      },
      'activity1#MultiInstanceBody': {
        id: 'activity1#MultiInstanceBody',
      },
    };
    expect(component.consolidateActivityPseudoIds(activityObj)).toEqual({
      activity1: { id: 'activity1' },
    });
  });

  it('should set editing mode when action is edit', async () => {
    const event = { target: 'diagramTools', action: 'edit', value: true };
    component.setEditing = vi.fn();
    await component.onToolbarButtonClick(event);
    expect(component.setEditing).toHaveBeenCalledWith(true);
  });

  it('should zoom the diagram when action is zoom', async () => {
    const event = { target: 'diagramTools', action: 'zoom', value: 1.5 };
    component.diagramComponent = { zoomDiagram: vi.fn() } as unknown as GenericDiagramSectionViewComponent;
    await component.onToolbarButtonClick(event);
    expect(component.diagramComponent.zoomDiagram).toHaveBeenCalledWith(1.5);
  });

  it('should reset the diagram view when action is reset-view', async () => {
    const event = { target: 'diagramTools', action: 'reset-view' };
    component.diagramComponent = { recenterDiagramView: vi.fn() } as unknown as GenericDiagramSectionViewComponent;
    await component.onToolbarButtonClick(event);
    expect(component.diagramComponent.recenterDiagramView).toHaveBeenCalled();
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

  describe('flattenActivities', () => {
    let flattenActivities: (activities: ActivityInstance[]) => (ActivityInstance | TransitionInstance)[];

    beforeEach(() => {
      flattenActivities = (component as any).flattenActivities.bind(component);
    });
    it('should return an empty array when given an empty array', () => {
      const result = flattenActivities([]);
      expect(result).toEqual([]);
    });

    it('should flatten a single-level array of activities', () => {
      const activities: ActivityInstance[] = [
        { id: '1', childActivityInstances: [], childTransitionInstances: [] },
        { id: '2', childActivityInstances: [], childTransitionInstances: [] },
      ];
      const result = flattenActivities(activities);
      expect(result).toEqual(activities);
    });

    it('should flatten nested activity instances', () => {
      const activities: ActivityInstance[] = [
        {
          id: '1',
          childActivityInstances: [
            {
              id: '1.1',
              childActivityInstances: [{ id: '1.1.1', childActivityInstances: [], childTransitionInstances: [] }],
              childTransitionInstances: [],
            },
          ],
          childTransitionInstances: [],
        },
      ];
      const result = flattenActivities(activities);
      expect(result).toEqual([
        activities[0],
        activities[0]?.childActivityInstances?.[0],
        activities[0]?.childActivityInstances?.[0]?.childActivityInstances?.[0],
      ]);
    });

    it('should include transition instances in the flattened array', () => {
      const activities: ActivityInstance[] = [
        {
          id: '1',
          childActivityInstances: [],
          childTransitionInstances: [{ id: '1.1', activityId: 'transition1' }],
        },
      ];
      const result = flattenActivities(activities);
      expect(result).toEqual([activities[0], activities[0].childTransitionInstances?.[0]]);
    });
  });

  describe('getAllIncidents', () => {
    it('should return an empty array when there are no incidents', () => {
      const activities: ActivityInstance[] = [
        { id: '1', incidents: [], childActivityInstances: [], childTransitionInstances: [] },
      ];
      const result = component.getAllIncidents(activities);
      expect(result).toEqual([]);
    });

    it('should collect incidents from a single-level array of activities', () => {
      const activities = [
        {
          id: '1',
          incidents: [{ id: 'incident1', activityId: 'activityId1' }],
          childActivityInstances: [],
          childTransitionInstances: [],
        },
        {
          id: '2',
          incidents: [{ id: 'incident2', activityId: 'activityId2' }],
          childActivityInstances: [],
          childTransitionInstances: [],
        },
      ];
      const result = component.getAllIncidents(activities);
      expect(result).toEqual([
        { id: 'incident1', activityId: 'activityId1' },
        { id: 'incident2', activityId: 'activityId2' },
      ]);
    });

    it('should collect incidents from nested activity instances', () => {
      const activities: ActivityInstance[] = [
        {
          id: '1',
          incidents: [{ id: 'incident1', activityId: 'activityId1' }],
          childActivityInstances: [
            {
              id: '1.1',
              incidents: [{ id: 'incident2', activityId: 'activityId2' }],
              childActivityInstances: [],
              childTransitionInstances: [],
            },
          ],
          childTransitionInstances: [],
        },
      ];
      const result = component.getAllIncidents(activities);
      expect(result).toEqual([activities[0].incidents?.[0], activities[0].childActivityInstances?.[0].incidents?.[0]]);
    });

    it('should collect incidents from both child activities and transitions', () => {
      const activities: ActivityInstance[] = [
        {
          id: '1',
          incidents: [{ id: 'incident1', activityId: 'activityId1' }],
          childActivityInstances: [],
          childTransitionInstances: [
            {
              id: '1.1',
              incidents: [{ id: 'incident2', activityId: 'activityId2' }],
            },
          ],
        },
      ];
      const result = component.getAllIncidents(activities);
      expect(result).toEqual([
        activities[0].incidents?.[0],
        activities[0].childTransitionInstances?.[0].incidents?.[0],
      ]);
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
      component.ngOnInit();

      const centerElementSpy = vi.spyOn(component, 'centerElement');
      component.eventBus.rowClickedWithActivity$.next('activity');

      expect(centerElementSpy).toHaveBeenCalled();
    });

    it('should center element if valid activityId is provided', async () => {
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

    it('should center element onDiagramRendered if activityId is in query params', async () => {
      const centerElementSpy = vi.spyOn(component, 'centerElement');

      component.selectedActivityId = 'valid-id';
      component.onDiagramRendered(true);

      expect(centerElementSpy).toHaveBeenCalledWith('valid-id');
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

  it('should handle a canvas size change', async () => {
    component.diagramComponent = {
      notifyCanvasSizeChanged: vi.fn(),
    } as unknown as GenericDiagramSectionViewComponent;
    component.onCanvasSizeChanged();

    expect(component.diagramComponent.notifyCanvasSizeChanged).toHaveBeenCalled();
  });

  describe('tabFilterUpdated handler', () => {
    let updateQueryParamsSpy: any;
    let updateCountForTabSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();
      component.setUpTabs();
      updateQueryParamsSpy = vi.spyOn(component, 'updateQueryParams');
      updateCountForTabSpy = vi.spyOn(component, 'updateCountForTab');
    });

    it('should handle when filter has activityId', () => {
      const tabAndFilter = { filter: { activityId: 'foo' }, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: 'foo', activityId: 'foo' });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should handle when filter has activityIdIn array', () => {
      const tabAndFilter = { filter: { activityIdIn: ['foo'] }, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: 'foo', activityId: 'foo' });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should handle when filter has neither activityId nor activityIdIn (filter is cleared)', () => {
      const tabAndFilter = { filter: { someOther: 'val' }, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: undefined, activityId: undefined });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should handle when activityId does not exist', () => {
      const tabAndFilter = { filter: { activityId: undefined }, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: undefined, activityId: undefined });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should handle when activityIdIn does not exist', () => {
      const tabAndFilter = { filter: { activityIdIn: undefined }, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: undefined, activityId: undefined });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });

    it('should handle when filter is undefined', () => {
      const tabAndFilter = { filter: undefined, tab: 'someTab' };

      component.eventBus.tabFilterUpdated(tabAndFilter);

      expect(updateQueryParamsSpy).toHaveBeenCalledWith({ filteredActivityId: undefined, activityId: undefined });
      expect(updateCountForTabSpy).toHaveBeenCalledWith(tabAndFilter);
    });
  });

  it('tabHasActivityFilter should return false for variables and history', () => {
    expect(component.tabHasActivityFilter(PimTab.Variables)).toBe(false);
    expect(component.tabHasActivityFilter(PimTab.History)).toBe(false);
  });

  it('tabHasActivityFilter should return true for anything but variables or history', () => {
    expect(component.tabHasActivityFilter(PimTab.Incidents)).toBe(true);
    expect(component.tabHasActivityFilter(PimTab.CalledProcessInstances)).toBe(true);
    expect(component.tabHasActivityFilter(PimTab.Jobs)).toBe(true);
    expect(component.tabHasActivityFilter(PimTab.DecisionInstances)).toBe(true);
  });
});
