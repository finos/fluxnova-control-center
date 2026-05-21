import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ConfirmActionService } from '../../../services/confirm-action.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { DecisionInstanceTabs } from '../../item-detail-tab-utils';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { DecisionDiagramViewerComponent } from '../../../common/diagram/decision-diagram-viewer.component';
import { DecisionInstanceDetailPageComponent } from './decision-instance-detail-page.component';

describe('DecisionInstanceDetailPageComponent', () => {
  let component: DecisionInstanceDetailPageComponent;
  let fixture: ComponentFixture<DecisionInstanceDetailPageComponent>;

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockService: Mocked<DecisionInstanceService> = {
    getInstance: vi.fn(() => of({})),
  } as unknown as Mocked<DecisionInstanceService>;

  const mockRoute = {
    params: of([{ instanceId: '1a' }]),
    snapshot: {
      data: {
        itemType: 'decision-instance',
        itemTypeClass: 'decision-instance',
        itemTypeListName: 'Decision Definition',
        itemTypeName: 'Decision Instance',
      },
      params: {
        instanceId: '1a',
      },
      queryParams: of({
        tab: '',
      }),
    },
    queryParams: of({}),
  };

  const mockHttp = { get: vi.fn(() => ({ pipe: vi.fn() })) } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DecisionInstanceDetailPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: DecisionInstanceService,
          useValue: mockService,
        },
        { provide: ConfirmActionService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DecisionInstanceDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set observables for is item found on init', async () => {
    component.ngOnInit();

    expect(mockService.getInstance).toHaveBeenCalledWith('1a');
    expect(component.isItemFound$).toBeDefined();
    await expect(lastValueFrom(component.isItemFound$ as any)).resolves.toEqual(true);
    expect(component.isLoading).toEqual(false);
  });

  it('get itemId should return the instanceId from the url', () => {
    expect(component.itemId).toBe('1a');
  });

  it('should override default initTabNames function', () => {
    component.ngOnInit();
    expect(component.tabs).toEqual(DecisionInstanceTabs);
  });

  it('should zoom the diagram when event.target is diagramTools and event.action is zoom', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'zoom',
      target: 'diagramTools',
      value: 1.5,
    };

    component.diagramSection = {
      zoomDiagram: vi.fn(),
    } as any;

    component.onToolbarButtonClick(toolbarEvent);

    expect(component.diagramSection?.zoomDiagram).toHaveBeenCalledWith(1.5);
  });

  it('should reset the diagram view when event.target is diagramTools and event.action is reset-view', () => {
    const toolbarEvent: ToolbarEvent = {
      action: 'reset-view',
      target: 'diagramTools',
      value: '',
    };

    component.diagramSection = {
      recenterDiagramView: vi.fn(),
    } as any;

    component.onToolbarButtonClick(toolbarEvent);

    expect(component.diagramSection?.recenterDiagramView).toHaveBeenCalled();
  });

  it('should call updateDiagramToolbar in ngAfterViewChecked', () => {
    vi.spyOn(component, 'updateDiagramToolbar');
    component.ngAfterViewChecked();
    expect(component.updateDiagramToolbar).toHaveBeenCalled();
  });

  it('should set includeDiagramToolbar based on diagramSection.canZoom in updateDiagramToolbar', async () => {
    component.diagramSection = { canZoom: true } as any;
    component.updateDiagramToolbar();
    await vi.runAllTimersAsync();
    expect(component.includeDiagramToolbar).toBe(true);

    component.diagramSection = { canZoom: false } as any;
    component.updateDiagramToolbar();
    await vi.runAllTimersAsync();
    expect(component.includeDiagramToolbar).toBe(false);

    component.diagramSection = undefined;
    component.updateDiagramToolbar();
    await vi.runAllTimersAsync();
    expect(component.includeDiagramToolbar).toBe(false);
  });

  it('should handle a canvas size change', async () => {
    component.diagramSection = {
      notifyCanvasSizeChanged: vi.fn(),
    } as unknown as DecisionDiagramViewerComponent;
    component.onCanvasSizeChanged();

    expect(component.diagramSection.notifyCanvasSizeChanged).toHaveBeenCalled();
  });
});
