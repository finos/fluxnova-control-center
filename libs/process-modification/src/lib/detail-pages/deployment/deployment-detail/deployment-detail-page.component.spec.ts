import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { SIDE_DRAWER_CLOSED_WIDTH, SIDE_DRAWER_COLLAPSIBLE_WIDTH, SIDE_DRAWER_OPEN_WIDTH } from '@fxn/common';
import { provideHttpClient } from '@angular/common/http';
import { DeploymentResource } from '@fxn/types';
import { DOCUMENT } from '@angular/common';
import { SplitComponent } from 'angular-split';
import { ButtonActions } from '@fxn/types/src/button-actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeploymentService } from '../../../services/deployment.service';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { DeploymentResourceUtilsService } from '../../../services/deployment-resource-utils.service';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { PimTab } from '../../item-detail-tab-utils';
import { DEFAULT_LEFT_PANE_WIDTH_PX, GUTTER_SIZE, PanelState } from '../../item-detail-page.component';
import { DeploymentDetailsPageComponent } from './deployment-detail-page.component';

describe('Deployment Details Component', () => {
  let component: DeploymentDetailsPageComponent;
  let fixture: ComponentFixture<DeploymentDetailsPageComponent>;
  let sideNav: HTMLDivElement;

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockDeploymentService: Partial<DeploymentService> = {
    selectedResource: new BehaviorSubject<DeploymentResource>({} as any),
    deploymentTabs: new BehaviorSubject<any[]>([]),
    getDeploymentDetails: vi.fn(() => of({} as any)),
    setSelectedResource: vi.fn(),
  };

  const mockInfoPanelState = {
    getVisibility: vi.fn(),
    initialSize: DEFAULT_LEFT_PANE_WIDTH_PX,
    setSize: vi.fn(),
    toggleVisibility: vi.fn(),
  };

  const mockConfirmActionService = {
    deleteDeployment: vi.fn().mockReturnValue(of({})),
  };

  let mockDoc: Document;

  const mockDeploymentResourceUtilsService: DeploymentResourceUtilsService = {
    downloadDeploymentResource: vi.fn(),
    isBPMN: vi.fn((resource: DeploymentResource) => resource.name?.includes('bpmn')),
    isDMN: vi.fn((resource: DeploymentResource) => resource.name?.includes('dmn')),
  } as unknown as DeploymentResourceUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, NgbPaginationModule, RouterTestingModule],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of([{ id: 1 }]),
            queryParams: of([{ tab: 'instances' }]),
            snapshot: {
              data: {
                itemType: 'Deployment',
                itemTypeClass: 'deployment',
                itemTypeListName: 'Deployments',
                itemTypeName: 'Deployment',
              },
              params: {
                id: 1,
              },
              queryParams: of([{ tab: 'instances' }]),
            },
          },
        },
        { provide: ConfirmActionService, useValue: mockConfirmActionService },
        {
          provide: DeploymentResourceUtilsService,
          useValue: mockDeploymentResourceUtilsService,
        },
        ToolbarService,
        { provide: DeploymentService, useValue: mockDeploymentService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      declarations: [DeploymentDetailsPageComponent],
    });
    mockDoc = TestBed.inject(DOCUMENT);
    sideNav = mockDoc.createElement('div');
    sideNav.setAttribute('id', 'dashboard_side_color');
    sideNav.setAttribute('style', 'display:block;width:399px');
    mockDoc.body.appendChild(sideNav);
    fixture = TestBed.createComponent(DeploymentDetailsPageComponent);
    component = fixture.componentInstance;
    component.infoPanelState = mockInfoPanelState as unknown as PanelState;
    component.selectedResource = { id: 'test-id', name: 'test-name', deploymentId: 'test-deployment-id' };
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockDoc.body.removeChild(sideNav);
  });

  it('should render', () => {
    expect(component).toBeTruthy();
  });

  it('should get the side_nav from the document', () => {
    vi.spyOn(mockDoc, 'querySelector');
    component.setupSideNavWatchers();
    expect(mockDoc.querySelector).toHaveBeenCalledWith('[id="dashboard_side_color"]');
  });

  it('should update the rightPanelXPosition when the side nav opens', () => {
    component.rightPanelXPosition = 123;
    Object.defineProperty(sideNav, 'offsetWidth', { value: SIDE_DRAWER_OPEN_WIDTH });

    sideNav.dispatchEvent(new Event('transitionend'));

    expect(component.rightPanelXPosition).toBe(123 + SIDE_DRAWER_COLLAPSIBLE_WIDTH);
  });

  it('should update the rightPanelXPosition when the side nav closes', () => {
    component.rightPanelXPosition = 654;
    Object.defineProperty(sideNav, 'offsetWidth', { value: SIDE_DRAWER_CLOSED_WIDTH });

    sideNav.dispatchEvent(new Event('transitionend'));

    expect(component.rightPanelXPosition).toBe(654 - SIDE_DRAWER_COLLAPSIBLE_WIDTH);
  });

  it('should not update the rightPanelXPosition when transition event target is not the side nav', () => {
    component.rightPanelXPosition = 500;
    const sideNavChildElement = mockDoc.createElement('div');
    sideNav.appendChild(sideNavChildElement);

    sideNavChildElement.dispatchEvent(new Event('transitionend'));

    expect(component.rightPanelXPosition).toBe(500);
  });

  it('should update the rightPanelXPosition when the splitter is dragged', () => {
    const splitter = {
      dragProgress$: new BehaviorSubject({ sizes: [123] }),
    } as unknown as SplitComponent;

    component.split = splitter;

    fixture.detectChanges();

    expect(component.rightPanelXPosition).toBe(191);

    (splitter.dragProgress$ as BehaviorSubject<any>).next({ sizes: [280] });

    expect(component.rightPanelXPosition).toBe(348);
  });

  it('should update the rightPanelXPosition when the info panel is closed using button', () => {
    Object.defineProperty(sideNav, 'offsetWidth', { value: SIDE_DRAWER_OPEN_WIDTH });
    mockInfoPanelState.getVisibility.mockReturnValueOnce(false);

    component.expandOrCollapsePanel(mockInfoPanelState as unknown as PanelState);

    expect(component.rightPanelXPosition).toBe(sideNav.offsetWidth + GUTTER_SIZE);
  });

  it('should update the rightPanelXPosition when the info panel is opened using button', () => {
    Object.defineProperty(sideNav, 'offsetWidth', { value: SIDE_DRAWER_OPEN_WIDTH });
    mockInfoPanelState.getVisibility.mockReturnValueOnce(true);

    component.expandOrCollapsePanel(mockInfoPanelState as unknown as PanelState);

    expect(component.rightPanelXPosition).toBe(DEFAULT_LEFT_PANE_WIDTH_PX + sideNav.offsetWidth + GUTTER_SIZE);
  });

  it('should ignore non-info panel state objects', () => {
    component.rightPanelXPosition = 123;
    component.expandOrCollapsePanel({ ...mockInfoPanelState } as unknown as PanelState);

    expect(component.rightPanelXPosition).toBe(123);
  });

  it('should set topPanelHeight to 100 if resource is not DMN or BPMN', async () => {
    component.selectedResource = {
      data: 'test data',
      deploymentId: '50067269-49e6-11ef-8385-ee069472f9fc',
      id: '5006726b-49e6-11ef-8385-ee069472f9fc',
      name: `some-file.groovy`,
    };

    component.ngOnInit();
    await vi.advanceTimersByTimeAsync(1);

    expect(component.initialPanelSize.topPaneHeight).toBe(100);
  });

  it('should set resource on the fileViewComponent', async () => {
    component.selectedResource = {
      data: 'test data',
      deploymentId: '50067269-49e6-11ef-8385-ee069472f9fc',
      id: '5006726b-49e6-11ef-8385-ee069472f9fc',
      name: `some-file.groovy`,
    };
    component.fvc = { resource: undefined } as any;
    component.ngOnInit();

    await vi.advanceTimersByTimeAsync(1);

    expect(component.fvc?.resource).toBe(component.selectedResource);
  });

  it('should set tabs to Process Instance Links for BPMN resource', () => {
    const resource: any = { name: 'process.bpmn' };

    vi.spyOn(mockDeploymentResourceUtilsService, 'isBPMN').mockReturnValue(true);
    vi.spyOn(mockDeploymentResourceUtilsService, 'isDMN').mockReturnValue(false);

    component.setTabsBasedOnResource(resource);

    expect(component.tabs).toEqual([PimTab.Definitions]);

    expect(component.activeTab).toBe(PimTab.Definitions);
  });

  it('should set tabs to Decision Definitions and Decision Requirements Definitions for DMN resource', () => {
    const resource: any = { name: 'decision.dmn' };

    vi.spyOn(mockDeploymentResourceUtilsService, 'isBPMN').mockReturnValue(false);
    vi.spyOn(mockDeploymentResourceUtilsService, 'isDMN').mockReturnValue(true);

    component.setTabsBasedOnResource(resource);

    expect(component.tabs).toEqual([PimTab.Definitions, PimTab.DecisionRequirementsDefinitions]);

    expect(component.activeTab).toBe(PimTab.Definitions);
  });

  it('should not run downloadResource when ButtonAction is not download resource', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'click',
      target: ButtonActions.ACTIVATE,
      value: '',
    };

    component.onToolbarButtonClick(toolbarEvent);

    expect(mockDeploymentResourceUtilsService.downloadDeploymentResource).not.toHaveBeenCalled();
  });

  it('should run downloadDeploymentResource when ButtonAction is download resource and selected resource is set', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'click',
      target: ButtonActions.DOWNLOAD_RESOURCE,
      value: '',
    };

    component.selectedResource = {
      data: 'test data',
      deploymentId: '50067269-49e6-11ef-8385-ee069472f9fc',
      id: '5006726b-49e6-11ef-8385-ee069472f9fc',
      name: `some-file.bpmn`,
    };
    component.onToolbarButtonClick(toolbarEvent);

    fixture.detectChanges();

    expect(mockDeploymentResourceUtilsService.downloadDeploymentResource).toHaveBeenCalledTimes(1);
  });

  it('should not run deleteDeployment when ButtonAction is not delete', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'click',
      target: ButtonActions.ACTIVATE,
      value: '',
    };

    component.onToolbarButtonClick(toolbarEvent);

    expect(mockConfirmActionService.deleteDeployment).not.toHaveBeenCalled();
  });

  it('should run deleteDeployment when ButtonAction is delete', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'click',
      target: ButtonActions.DELETE,
      value: '',
    };

    component.onToolbarButtonClick(toolbarEvent);

    fixture.detectChanges();

    expect(mockConfirmActionService.deleteDeployment).toHaveBeenCalledTimes(1);
  });

  it('should zoom the diagram when event.target is diagramTools and event.action is zoom', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'zoom',
      target: 'diagramTools',
      value: 1.5,
    };

    component.fvc = {
      diagramSection: {
        zoomDiagram: vi.fn(),
      },
    } as any;

    component.onToolbarButtonClick(toolbarEvent);

    expect(component.fvc?.diagramSection.zoomDiagram).toHaveBeenCalledWith(1.5);
  });

  it('should reset the diagram view when event.target is diagramTools and event.action is reset-view', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'reset-view',
      target: 'diagramTools',
      value: '',
    };

    component.fvc = {
      diagramSection: {
        recenterDiagramView: vi.fn(),
      },
    } as any;

    component.onToolbarButtonClick(toolbarEvent);

    expect(component.fvc?.diagramSection.recenterDiagramView).toHaveBeenCalled();
  });

  it('should set includeDiagramToolbar based on diagram.canZoom', async () => {
    component.fvc = {
      diagramSection: {
        canZoom: true,
        notifyCanvasSizeChanged: vi.fn(),
        recenterDiagramView: vi.fn(),
      },
    } as any;

    component.onFileViewChanged();
    await vi.runAllTimersAsync();

    expect(component.includeDiagramToolbar).toBe(true);

    component.fvc = {
      diagramSection: {
        canZoom: false,
      },
    } as any;

    component.onFileViewChanged();
    await vi.runAllTimersAsync();

    expect(component.includeDiagramToolbar).toBe(false);
  });

  it('should center diagram with offset when bottom panel is hidden', async () => {
    component.fvc = {
      diagramSection: {
        recenterDiagramView: vi.fn(),
      },
      showDiagram: false, // Scripts hide bottom panel
    } as any;
    component.tabPanelState.setVisibility(true);

    component.onFileViewChanged();
    await vi.runAllTimersAsync();

    expect(component.fvc?.diagramSection?.recenterDiagramView).not.toHaveBeenCalled();

    component.fvc = {
      diagramSection: {
        recenterDiagramView: vi.fn(),
      },
      showDiagram: true, // Diagram becomes visible after file view changes and shows diagram
    } as any;
    component.tabPanelState.setVisibility(false);

    component.onFileViewChanged();
    await vi.runAllTimersAsync();

    expect(component.fvc?.diagramSection?.recenterDiagramView).toHaveBeenCalledWith({ x: 0, y: 0.2 });
  });
});
