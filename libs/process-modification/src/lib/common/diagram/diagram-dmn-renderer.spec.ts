import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import DmnJSNavigatedViewer from 'dmn-js/lib/NavigatedViewer';
import { DIAGRAM_TYPE } from '@fxn/types';
import { DiagramDmnRenderer } from './diagram-dmn-renderer';

describe('diagram-dmn-renderer', () => {
  let diagramDmnRenderer: DiagramDmnRenderer;
  let mockDmnJSNavigatedViewer: DmnJSNavigatedViewer;
  let mockDiagramCanvas: {
    resized: () => void;
    zoom: () => void;
  };

  let mockGetViews!: Mock;
  let mockOpen!: Mock;

  beforeEach(() => {
    const mockResourceXmlData = '<xml></xml>';

    mockDiagramCanvas = {
      resized: vi.fn(),
      zoom: vi.fn(),
    };

    mockGetViews = vi.fn(() => []);
    mockOpen = vi.fn();

    mockDmnJSNavigatedViewer = {
      getActiveViewer: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(mockDiagramCanvas),
      }),
      getActiveView: vi.fn(),
      getViews: mockGetViews,
      importXML: vi.fn().mockResolvedValue(undefined),
      open: mockOpen,
      detach: vi.fn(),
    } as unknown as DmnJSNavigatedViewer;

    diagramDmnRenderer = new DiagramDmnRenderer(mockResourceXmlData, mockDmnJSNavigatedViewer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should run open', () => {
    diagramDmnRenderer.open('test-view-id');

    expect(mockDmnJSNavigatedViewer.open).toHaveBeenCalled();
  });

  it('should run render', async () => {
    await diagramDmnRenderer.render();

    expect(mockDmnJSNavigatedViewer.importXML).toHaveBeenCalled();
  });

  it('should run reposition', () => {
    diagramDmnRenderer.reposition();

    expect(mockDmnJSNavigatedViewer.getActiveViewer).toHaveBeenCalled();
    expect(mockDiagramCanvas.resized).toHaveBeenCalled();
    expect(mockDiagramCanvas.zoom).toHaveBeenCalled();
  });

  it('should call detach', () => {
    diagramDmnRenderer.detach();

    expect(mockDmnJSNavigatedViewer.detach).toHaveBeenCalled();
  });

  describe('openFirstDecisionTable', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call dmnViewer.getViews', () => {
      diagramDmnRenderer.openFirstDecisionTable();

      expect(mockGetViews).toHaveBeenCalled();
    });

    it('should not call dmnViewer.open if no decisionTable view exists', () => {
      mockGetViews.mockReturnValue([]);

      diagramDmnRenderer.openFirstDecisionTable();

      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('should not dmnViewer.open if decisionTable view exists', () => {
      mockGetViews.mockReturnValue([{ type: 'decisionTable' }]);

      diagramDmnRenderer.openFirstDecisionTable();

      expect(mockOpen).toHaveBeenCalled();
    });

    it('should return the navigated viewer', () => {
      expect(diagramDmnRenderer.navigatedViewer).toBe(mockDmnJSNavigatedViewer);
    });
  });

  describe('getDiagramType', () => {
    it('should return DMN diagram type when active view is decisionTable', () => {
      mockDmnJSNavigatedViewer.getActiveView = vi.fn().mockReturnValue({ type: 'decisionTable' });
      expect(diagramDmnRenderer.getDiagramType()).toBe(DIAGRAM_TYPE.DMN);
    });

    it('should return DRD diagram type when active view is drd', () => {
      mockDmnJSNavigatedViewer.getActiveView = vi.fn().mockReturnValue({ type: 'drd' });
      expect(diagramDmnRenderer.getDiagramType()).toBe(DIAGRAM_TYPE.DRD);
    });
  });
});
