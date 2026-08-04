import { TestBed } from '@angular/core/testing';
import { DIAGRAM_TYPE, ThemeName } from '@fxn/types';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ColorRenderer } from '../extensions/color-renderer';
import { ViewerService } from './viewer.service';
import { DiagramRendererService } from './diagram-renderer.service';

describe('DiagramRendererService', () => {
  let service: DiagramRendererService;
  let viewerServiceMock: Mocked<ViewerService>;

  beforeEach(() => {
    viewerServiceMock = {
      getNavigatedViewer: vi.fn(),
      getDMNJSViewer: vi.fn(),
    } as unknown as Mocked<ViewerService>;

    TestBed.configureTestingModule({
      providers: [DiagramRendererService, { provide: ViewerService, useValue: viewerServiceMock }],
    });

    service = TestBed.inject(DiagramRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not render diagram if resourceXMLData is empty', async () => {
    const element = document.createElement('div');

    expect(() => service.getDiagramRenderer('', DIAGRAM_TYPE.DMN, element)).toThrow();
    expect(viewerServiceMock.getNavigatedViewer).not.toHaveBeenCalled();
    expect(viewerServiceMock.getDMNJSViewer).not.toHaveBeenCalled();
  });

  it('should render BPMN diagram if resource is BPMN', async () => {
    const diagramXml = '<xml></xml>';
    const element = document.createElement('div');
    const themeName = 'default' as ThemeName;

    const mockedNavigatedViewer = {
      importXML() {},
      get(key: string) {
        const map = new Map();

        map.set('canvas', { zoom() {} });
        map.set('colorRenderer', {
          setColors() {},
        } as unknown as Mocked<ColorRenderer>);

        return map.get(key);
      },
      zoom() {},
    } as unknown as Mocked<NavigatedViewer>;

    viewerServiceMock.getNavigatedViewer.mockReturnValue(mockedNavigatedViewer);

    const renderer = service.getDiagramRenderer(diagramXml, DIAGRAM_TYPE.BPMN, element, themeName);

    await service.renderDiagram(renderer);

    expect(viewerServiceMock.getNavigatedViewer).toHaveBeenCalledWith(element);
  });

  it('should render DMN diagram with resource as DMN', async () => {
    const diagramXml = '<xml></xml>';
    const element = document.createElement('div');
    const mockResizedFn = vi.fn();
    const mockZoomFn = vi.fn();

    const mockActiveViewer = {
      get() {
        return {
          resized: mockResizedFn,
          zoom: mockZoomFn,
        };
      },
    };

    viewerServiceMock.getDMNJSViewer.mockReturnValue({
      importXML: vi.fn().mockResolvedValue(undefined),
      getActiveViewer: vi.fn().mockReturnValue(mockActiveViewer),
      getViews: vi.fn().mockReturnValue([]),
      open: vi.fn().mockResolvedValue({}),
    } as unknown as DmnJSNavigatedViewer);

    const renderer = service.getDiagramRenderer(diagramXml, DIAGRAM_TYPE.DMN, element);

    await service.renderDiagram(renderer);

    expect(viewerServiceMock.getDMNJSViewer).toHaveBeenCalledWith(element);
  });

  it('should run open with resource as DMN', async () => {
    const diagramXml = '<xml></xml>';
    const element = document.createElement('div');
    const mockResizedFn = vi.fn();
    const mockZoomFn = vi.fn();

    const mockActiveViewer = {
      get() {
        return {
          resized: mockResizedFn,
          zoom: mockZoomFn,
        };
      },
    };

    const mockDmnJSNavigatedViewer = {
      importXML: vi.fn().mockResolvedValue(undefined),
      getActiveViewer: vi.fn().mockReturnValue(mockActiveViewer),
      getViews: vi.fn().mockReturnValue([]),
      open: vi.fn(),
    } as unknown as DmnJSNavigatedViewer;

    viewerServiceMock.getDMNJSViewer.mockReturnValue(mockDmnJSNavigatedViewer);

    const renderer = service.getDiagramRenderer(diagramXml, DIAGRAM_TYPE.DMN, element);

    await service.renderDiagram(renderer);
    await service.openDiagramView(renderer);

    expect(mockDmnJSNavigatedViewer.open).not.toHaveBeenCalled();

    await service.openDiagramView(renderer, 'test-viewId');

    expect(mockDmnJSNavigatedViewer.open).toHaveBeenCalled();
  });
});
