import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { DIAGRAM_TYPE, ProcessDefinitionDiagram } from '@fxn/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramService } from '../../services/diagram.service';
import { DiagramRendererService } from './services/diagram-renderer.service';
import { GenericDiagramSectionViewComponent } from './generic-diagram-viewer.component';

describe('GenericDiagramViewerComponent', () => {
  let component: GenericDiagramSectionViewComponent;
  let fixture: ComponentFixture<GenericDiagramSectionViewComponent>;

  const mockDiagram = { definitionId: '123', xml: '<xml></xml>', name: 'hello' };
  const mockDiagramService = {
    getDiagram: vi.fn().mockReturnValue(of(mockDiagram)),
  };
  const mockRenderer = {
    open: vi.fn(),
    render: vi.fn(),
    reposition: vi.fn(),
    navigatedViewer: {
      destroy: vi.fn(),
    },
    getDiagramType: vi.fn(),
  };

  const mockDiagramRendererService = {
    renderDiagram: vi.fn(),
    openDiagramView: vi.fn(),
    getDiagramRenderer: vi.fn().mockReturnValue(mockRenderer),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericDiagramSectionViewComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {
          provide: DiagramService,
          useValue: mockDiagramService,
        },
        {
          provide: DiagramRendererService,
          useValue: mockDiagramRendererService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericDiagramSectionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should set diagramType', () => {
    expect(component.diagramType).toEqual(DIAGRAM_TYPE.BPMN);

    component.diagramType = DIAGRAM_TYPE.DMN;

    expect(component.diagramType).toEqual(DIAGRAM_TYPE.DMN);
  });

  it('should set id and call getDiagramXml', () => {
    const spy = vi.spyOn(component, 'getDiagramXml');
    component.id = 'asdf';

    expect(component.id).toEqual('asdf');
    expect(spy).toHaveBeenCalled();
  });

  it('should destroy renderer if it already exists when id is set', () => {
    component.renderDiagram(mockDiagram);

    component.id = 'asdf';

    expect(component.id).toEqual('asdf');
    expect(mockRenderer.navigatedViewer.destroy).toHaveBeenCalled();
  });

  it('should load the diagram xml', () => {
    component.id = 'asdf';

    expect(mockDiagramService.getDiagram).toHaveBeenCalledWith('asdf', DIAGRAM_TYPE.BPMN);
  });

  it('should render the diagram', async () => {
    const nativeElement = 'i am an element';
    const elem = {
      nativeElement,
    };
    let emissionCount = 0;
    let firstEmission: boolean | undefined;
    let secondEmission: boolean | undefined;

    component.diagramRendered.subscribe((rendered) => {
      emissionCount++;
      if (emissionCount === 1) {
        firstEmission = rendered;
      }
      if (emissionCount === 2) {
        secondEmission = rendered;
      }
    });

    component.diagramContainerDiv = elem;
    component.renderDiagram(mockDiagram);

    await vi.runAllTimersAsync();

    expect(firstEmission).toBe(false);
    expect(secondEmission).toBe(true);
    expect(mockDiagramRendererService.getDiagramRenderer).toHaveBeenCalledWith(
      mockDiagram.xml,
      DIAGRAM_TYPE.BPMN,
      nativeElement,
    );
    expect(mockDiagramRendererService.renderDiagram).toHaveBeenCalledWith(mockRenderer);
  });

  it('should handle error when rendering the diagram', async () => {
    vi.spyOn(component, 'renderDiagram').mockImplementationOnce(() => {
      throw new Error('Rendering error');
    });

    let isDiagramRendered: boolean | undefined;

    component.diagramRendered.subscribe((rendered) => (isDiagramRendered = rendered));

    component.id = 'asdf';

    await vi.runAllTimersAsync();

    expect(isDiagramRendered).toBe(false);
  });

  it('should clean itself up', () => {
    component.renderDiagram(mockDiagram);
    component.ngOnDestroy();

    expect(mockRenderer.navigatedViewer.destroy).toHaveBeenCalled();
  });

  it('should zoom the diagram', () => {
    const zoomScroll = {
      stepZoom: vi.fn(),
    };
    const mockViewer = {
      get: vi.fn().mockReturnValue(zoomScroll),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;

    component.zoomDiagram(1.5);

    expect(mockViewer.get).toHaveBeenCalledWith('zoomScroll');
    expect(zoomScroll.stepZoom).toHaveBeenCalledWith(1.5);
  });

  it('should recenter the diagram view', () => {
    const mockCanvas = {
      zoom: vi.fn(),
      resized: vi.fn(),
    };
    const mockViewer = {
      get: vi.fn().mockReturnValue(mockCanvas),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;

    component.recenterDiagramView();

    expect(mockViewer.get).toHaveBeenCalledWith('canvas');
    expect(mockCanvas.zoom).toHaveBeenCalledWith('fit-viewport', 'auto');
  });

  it('should recenter with offset', () => {
    const mockCanvas = {
      viewbox: vi.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }),
      zoom: vi.fn(),
      resized: vi.fn(),
      scroll: vi.fn(),
    };
    const mockViewer = {
      get: vi.fn().mockReturnValue(mockCanvas),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;

    component.recenterDiagramView({ x: 0.1, y: 0.1 });

    expect(mockViewer.get).toHaveBeenCalledWith('canvas');
    expect(mockCanvas.zoom).toHaveBeenCalledWith('fit-viewport', 'auto');
    expect(mockCanvas.viewbox).toHaveBeenCalled();
    expect(mockCanvas.scroll).toHaveBeenCalledWith({ dx: -10, dy: -10 });
  });

  it('should zoom a drd diagram', () => {
    const zoomScroll = {
      stepZoom: vi.fn(),
    };
    const mockActiveViewer = {
      get: vi.fn().mockReturnValue(zoomScroll),
    };
    const mockViewer = {
      getActiveViewer: vi.fn().mockReturnValue(mockActiveViewer),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;
    component.diagramType = DIAGRAM_TYPE.DMN;

    component.zoomDiagram(1.5);

    expect(mockViewer.getActiveViewer).toHaveBeenCalled();
    expect(mockActiveViewer.get).toHaveBeenCalledWith('zoomScroll');
    expect(zoomScroll.stepZoom).toHaveBeenCalledWith(1.5);
  });

  it('should recenter a drd diagram view', () => {
    const mockCanvas = {
      zoom: vi.fn(),
      resized: vi.fn(),
    };
    const mockActiveViewer = {
      get: vi.fn().mockReturnValue(mockCanvas),
    };
    const mockViewer = {
      getActiveViewer: vi.fn().mockReturnValue(mockActiveViewer),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;
    component.diagramType = DIAGRAM_TYPE.DMN;

    component.recenterDiagramView();

    expect(mockViewer.getActiveViewer).toHaveBeenCalled();
    expect(mockActiveViewer.get).toHaveBeenCalledWith('canvas');
    expect(mockCanvas.zoom).toHaveBeenCalledWith('fit-viewport', 'auto');
  });

  it('should notify the canvas that its size has changed for BPMN', () => {
    const mockCanvas = {
      resized: vi.fn(),
    };
    const mockViewer = {
      get: vi.fn().mockReturnValue(mockCanvas),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;

    component.notifyCanvasSizeChanged();

    expect(mockViewer.get).toHaveBeenCalledWith('canvas', false);
    expect(mockCanvas.resized).toHaveBeenCalled();
  });

  it('should notify the canvas that its size has changed for DMN', () => {
    const mockCanvas = {
      resized: vi.fn(),
    };
    const mockActiveViewer = {
      get: vi.fn().mockReturnValue(mockCanvas),
    };
    const mockViewer = {
      getActiveViewer: vi.fn().mockReturnValue(mockActiveViewer),
      destroy: vi.fn(),
    };
    component['renderer'] = { navigatedViewer: mockViewer } as any;
    component.diagramType = DIAGRAM_TYPE.DMN;

    component.notifyCanvasSizeChanged();

    expect(mockViewer.getActiveViewer).toHaveBeenCalled();
    expect(mockActiveViewer.get).toHaveBeenCalledWith('canvas', false);
    expect(mockCanvas.resized).toHaveBeenCalled();
  });

  describe('canZoom', () => {
    it('should return false if renderer is not defined', () => {
      mockDiagramRendererService.getDiagramRenderer = vi.fn().mockReturnValue(undefined);
      component.renderDiagram({} as unknown as ProcessDefinitionDiagram);

      expect(component.canZoom).toBe(false);
    });

    it('should return false if diagramType is DMN', () => {
      mockDiagramRendererService.getDiagramRenderer = vi.fn().mockReturnValue({
        getDiagramType: () => DIAGRAM_TYPE.DMN,
        navigatedViewer: {
          destroy: vi.fn(),
        },
      });
      component.renderDiagram({} as unknown as ProcessDefinitionDiagram);

      expect(component.canZoom).toBe(false);
    });

    it('should return true if diagramType is DRD', () => {
      mockDiagramRendererService.getDiagramRenderer = vi.fn().mockReturnValue({
        getDiagramType: () => DIAGRAM_TYPE.DRD,
        navigatedViewer: {
          destroy: vi.fn(),
        },
      });
      component.renderDiagram({} as unknown as ProcessDefinitionDiagram);

      expect(component.canZoom).toBe(true);
    });

    it('should return true if diagramType is BPMN', () => {
      mockDiagramRendererService.getDiagramRenderer = vi.fn().mockReturnValue({
        getDiagramType: () => DIAGRAM_TYPE.BPMN,
        navigatedViewer: {
          destroy: vi.fn(),
        },
      });
      component.renderDiagram({} as unknown as ProcessDefinitionDiagram);

      expect(component.canZoom).toBe(true);
    });
  });
});
