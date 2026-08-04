import NavigatedViewer from 'bpmn-js/lib/Viewer';
import ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import { formatMsToLargestTimeUnit } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { HeatmapUtil } from './heatmap-util';
import type Heatmap from 'visual-heatmap';

describe('HeatmapUtil', () => {
  let heatmapInstance: Heatmap & {
    setMin: Mock;
    setMax: Mock;
    renderData: Mock;
    render: Mock;
    resize: Mock;
    setTranslate: Mock;
    setZoom: Mock;
    setSize: Mock;
  };
  let navigatedViewer: Mocked<NavigatedViewer>;
  let elementRegistry: Mocked<ElementRegistry>;
  let canvas: any;
  let eventBus: any;
  let mockTooltip: HTMLElement;
  let mockAllElements: any[];
  let filterSpy: Mock;

  const createMockShape = (type: string, id: string, width = 100, height = 50) => ({
    type,
    id,
    businessObject: { id },
    width,
    height,
  });

  const createMockSequenceFlow = (sourceId: string, targetId: string) => {
    const id = `flow_${sourceId}_${targetId}`;
    return {
      type: 'bpmn:SequenceFlow',
      id,
      source: { businessObject: { id: sourceId } },
      target: { businessObject: { id: targetId } },
      waypoints: [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ],
      businessObject: { id },
    };
  };

  beforeEach(() => {
    mockTooltip = document.createElement('div');
    mockTooltip.id = 'heatmap-tooltip';
    const tooltipSpan = document.createElement('span');
    mockTooltip.appendChild(tooltipSpan);
    document.body.appendChild(mockTooltip);

    heatmapInstance = {
      setMin: vi.fn(),
      setMax: vi.fn(),
      renderData: vi.fn(),
      render: vi.fn(),
      resize: vi.fn(),
      setTranslate: vi.fn(),
      setZoom: vi.fn(),
      setSize: vi.fn(),
    } as unknown as Heatmap & {
      setMin: Mock;
      setMax: Mock;
      renderData: Mock;
      render: Mock;
      resize: Mock;
      setTranslate: Mock;
      setZoom: Mock;
      setSize: Mock;
    };

    canvas = {
      getAbsoluteBBox: vi.fn().mockImplementation(() => ({ x: 10, y: 10, width: 100, height: 50 })),
      getGraphics: vi.fn().mockImplementation(() => {
        const element = document.createElement('div');
        element.addEventListener = vi.fn();
        element.removeEventListener = vi.fn();
        return element;
      }),
      viewbox: vi.fn().mockReturnValue({ x: 0, y: 0, scale: 1 }),
    };

    eventBus = {
      on: vi.fn(),
      off: vi.fn(),
    };

    mockAllElements = [];

    elementRegistry = {
      getAll: vi.fn().mockImplementation(() => mockAllElements),
    } as unknown as Mocked<ElementRegistry>;

    filterSpy = vi.spyOn(Array.prototype, 'filter');

    navigatedViewer = {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'elementRegistry') return elementRegistry;
        if (key === 'canvas') return canvas;
        if (key === 'eventBus') return eventBus;
        return null;
      }),
    } as unknown as Mocked<NavigatedViewer>;
  });

  afterEach(() => {
    document.body.removeChild(mockTooltip);
    vi.clearAllMocks();
    filterSpy.mockRestore();
  });

  describe('renderHeatmap', () => {
    const mockHeatmapData = {
      count: {
        task1: 300,
        task2: 150,
        gateway1: 75,
        event1: 25,
        flow_task1_task2: 30,
      },
      averageDuration: {
        task1: 5000,
        task2: 2500,
        gateway1: 1000,
        event1: 500,
        flow_task1_task2: 1500,
      },
    };

    const mockHeatmapParams = {
      viewBy: 'count' as 'count' | 'timeSpent',
      active: true,
    };

    it('should handle count view correctly', () => {
      mockAllElements.length = 0;

      HeatmapUtil.renderHeatmap(heatmapInstance, mockHeatmapData, mockHeatmapParams, navigatedViewer);

      expect(elementRegistry.getAll).toHaveBeenCalled();
      expect(heatmapInstance.setMin).toHaveBeenCalledWith(0);
      expect(heatmapInstance.setMax).toHaveBeenCalledWith(100);
    });

    it('should handle timeSpent view correctly', () => {
      mockAllElements.length = 0;
      const timeSpentParams = {
        viewBy: 'timeSpent' as 'count' | 'timeSpent',
        active: true,
      };

      HeatmapUtil.renderHeatmap(heatmapInstance, mockHeatmapData, timeSpentParams, navigatedViewer);

      expect(elementRegistry.getAll).toHaveBeenCalled();
      expect(heatmapInstance.setMin).toHaveBeenCalledWith(0);
      expect(heatmapInstance.setMax).toHaveBeenCalledWith(100);
    });

    it('should process different BPMN element types', () => {
      mockAllElements = [
        createMockShape('bpmn:Task', 'task1'),
        createMockShape('bpmn:Gateway', 'gateway1'),
        createMockShape('bpmn:StartEvent', 'event1'),
        createMockSequenceFlow('task1', 'gateway1'),
      ];

      HeatmapUtil.renderHeatmap(heatmapInstance, mockHeatmapData, mockHeatmapParams, navigatedViewer);

      expect(elementRegistry.getAll).toHaveBeenCalled();
      expect(heatmapInstance.renderData).toHaveBeenCalled();
      expect(heatmapInstance.renderData.mock.calls[0][0]).toContainEqual({
        x: 2.5,
        y: 6.25,
        value: 0,
        radius: 17.5,
      });
    });

    it('should setup tooltips for each shape', () => {
      const mockTask = createMockShape('bpmn:Task', 'task1');
      mockAllElements = [mockTask];
      const spy = vi.spyOn(HeatmapUtil as any, 'setupHeatmapTooltip');

      HeatmapUtil.renderHeatmap(heatmapInstance, mockHeatmapData, mockHeatmapParams, navigatedViewer);

      expect(elementRegistry.getAll).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(mockTask, 'Count: 300', navigatedViewer);
      spy.mockRestore();
    });

    it('should format time correctly in tooltips for timeSpent view', () => {
      const mockTask = createMockShape('bpmn:Task', 'task1');
      mockAllElements = [mockTask];
      const timeSpentParams = {
        viewBy: 'timeSpent' as 'count' | 'timeSpent',
        active: true,
      };
      const spy = vi.spyOn(HeatmapUtil as any, 'setupHeatmapTooltip');

      HeatmapUtil.renderHeatmap(heatmapInstance, mockHeatmapData, timeSpentParams, navigatedViewer);

      expect(elementRegistry.getAll).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        mockTask,
        `Average Duration: ${formatMsToLargestTimeUnit(5000)}`,
        navigatedViewer,
      );
      spy.mockRestore();
    });
  });

  describe('cleanupHeatmapTooltip', () => {
    it('should remove event listeners and hide tooltip', () => {
      const mockGraphicsElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      canvas.getGraphics.mockReturnValue(mockGraphicsElement);

      (HeatmapUtil as any).shapeEnterHandlers = {
        task1: vi.fn(),
        task2: vi.fn(),
      };
      (HeatmapUtil as any).shapeLeaveHandlers = {
        task1: vi.fn(),
        task2: vi.fn(),
      };

      HeatmapUtil.cleanupHeatmapTooltip(navigatedViewer);

      expect(canvas.getGraphics).toHaveBeenCalledTimes(4);
      expect(mockTooltip.style.opacity).toBe('0');
    });
  });

  describe('private methods through public interface', () => {
    it('should generate appropriate points for tasks', () => {
      const mockTask = createMockShape('bpmn:Task', 'task1');
      mockAllElements = [mockTask];

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { task1: 100 },
          averageDuration: { task1: 5000 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      const dataPoints = heatmapInstance.renderData.mock.calls[0][0];
      expect(dataPoints.length).toBeGreaterThan(0);
      expect(dataPoints[0].x).toEqual(2.5);
      expect(dataPoints[0].y).toEqual(6.25);
      expect(dataPoints[0].value).toEqual(0);
      expect(dataPoints[0].radius).toEqual(17.5);
    });

    it('should generate appropriate points for gateways', () => {
      const mockGateway = createMockShape('bpmn:Gateway', 'gateway1');
      mockAllElements = [mockGateway];

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { gateway1: 75 },
          averageDuration: { gateway1: 1000 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      const dataPoints = heatmapInstance.renderData.mock.calls[0][0];
      expect(dataPoints[0].x).toEqual(10);
      expect(dataPoints[0].y).toEqual(35);
      expect(dataPoints[0].value).toEqual(21.916738879314764);
      expect(dataPoints[0].radius).toEqual(17.5);
    });

    it('should generate appropriate points for events', () => {
      const mockEvent = createMockShape('bpmn:StartEvent', 'event1', 30, 30);
      mockAllElements = [mockEvent];

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { event1: 25 },
          averageDuration: { event1: 500 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      const dataPoints = heatmapInstance.renderData.mock.calls[0][0];
      expect(dataPoints[0].x).toEqual(15.882352941176471);
      expect(dataPoints[0].y).toEqual(14.411764705882355);
      expect(dataPoints[0].value).toEqual(10.721670735285324);
      expect(dataPoints[0].radius).toEqual(17.5);
    });

    it('should generate appropriate points for sequence flows', () => {
      const mockFlow = createMockSequenceFlow('task1', 'task2');
      mockAllElements = [mockFlow];

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { flow_task1_task2: 30 },
          averageDuration: { flow_task1_task2: 1500 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      const dataPoints = heatmapInstance.renderData.mock.calls[0][0];
      expect(dataPoints[0].x).toEqual(10);
      expect(dataPoints[0].y).toEqual(10);
      expect(dataPoints[0].value).toEqual(5);
      expect(dataPoints[0].radius).toEqual(17.5);
    });
  });

  describe('tooltip behavior', () => {
    it('should update tooltip position on mouse enter', () => {
      const mockTask = createMockShape('bpmn:Task', 'task1');
      mockAllElements = [mockTask];
      const mockElement = document.createElement('div');
      let enterHandler = () => {};
      mockElement.addEventListener = vi.fn().mockImplementation((event, handler) => {
        if (event === 'mouseenter') enterHandler = handler;
      });
      canvas.getGraphics.mockReturnValue(mockElement);

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { task1: 100 },
          averageDuration: { task1: 5000 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      if (enterHandler) enterHandler();

      expect(mockTooltip.style.opacity).toBe('1');
      expect(mockTooltip.querySelector('span')?.textContent).toBe('Count: 100');
      expect(eventBus.on).toHaveBeenCalledWith('canvas.viewbox.changed', expect.any(Function));
    });

    it('should hide tooltip on mouse leave', () => {
      const mockTask = createMockShape('bpmn:Task', 'task1');
      mockAllElements = [mockTask];
      const mockElement = document.createElement('div');
      let leaveHandler = () => {};
      mockElement.addEventListener = vi.fn().mockImplementation((event, handler) => {
        if (event === 'mouseleave') leaveHandler = handler;
      });
      canvas.getGraphics.mockReturnValue(mockElement);

      HeatmapUtil.renderHeatmap(
        heatmapInstance,
        {
          count: { task1: 100 },
          averageDuration: { task1: 5000 },
        },
        { viewBy: 'count', active: true },
        navigatedViewer,
      );

      expect(elementRegistry.getAll).toHaveBeenCalled();
      if (leaveHandler) leaveHandler();

      expect(mockTooltip.style.opacity).toBe('0');
      expect(eventBus.off).toHaveBeenCalledWith('canvas.viewbox.changed', expect.any(Function));
    });
  });
});
