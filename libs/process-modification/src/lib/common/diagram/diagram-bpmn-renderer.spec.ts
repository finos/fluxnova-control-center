import { DIAGRAM_TYPE } from '@fxn/types';
import { BpmnColors } from '@fxn/common';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramBpmnRenderer } from './diagram-bpmn-renderer';

describe('diagram-bpmn-renderer', () => {
  let diagramBpmnRenderer: DiagramBpmnRenderer;
  let mockNavigatedViewer: NavigatedViewer;
  let mockBpmnColors: BpmnColors;

  beforeEach(() => {
    const mockResourceXmlData = '<xml></xml>';

    mockNavigatedViewer = {
      get: vi.fn(),
    } as unknown as NavigatedViewer;

    mockBpmnColors = {} as unknown as BpmnColors;

    diagramBpmnRenderer = new DiagramBpmnRenderer(mockResourceXmlData, mockNavigatedViewer, mockBpmnColors);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDiagramType', () => {
    it('should return BPMN diagram type', () => {
      expect(diagramBpmnRenderer.getDiagramType()).toBe(DIAGRAM_TYPE.BPMN);
    });
  });
});
