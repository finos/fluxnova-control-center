import { MockViewerService } from '@fxn/test-support/vitest';
import Icons from '@fxn/common/src/assets/icons.svg';
import { getBpmnColors } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramOverlaysUtil } from './diagram-overlays-util';
import { ContextMenuItemAction } from './context-menu/context-menu-item.service';

describe('The diagram overlays utility', () => {
  let component: DiagramOverlaysUtil;

  beforeEach(() => {
    component = DiagramOverlaysUtil.getInstance(MockViewerService.getNavigatedViewer(), {
      querySelector: vi.fn(() => ({
        parentElement: {
          style: {
            position: '',
            left: '',
            right: '',
            removeProperty: vi.fn(),
          },
        },
      })),
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should generate token symbol', () => {
    const circle = component.getTokenSvg('1234', 10, 'red', 'red', 'activeToken');
    const expected = `<svg width="20" height="20" viewBox="0 0 45 45" fill="none" data-stat-id="1234" class="activeToken">
      <circle cx="22.5" cy="22.5" r="21" fill="red" stroke="red" stroke-width="3"/>
      <text x="50%" y="58%" font-size="22px" dominant-baseline="middle" text-anchor="middle" fill="#000000">10</text>
    </svg>`;

    expect(circle).toEqual(expected);
  });

  it('should generate suspended token symbol', () => {
    const circle = component.getTokenSvg('1234', -1, 'orange', 'orange', 'suspended-token');
    const expected = `<svg width="20" height="20" viewBox="0 0 45 45" fill="none" data-stat-id="1234" class="suspended-token">
      <circle cx="22.5" cy="22.5" r="21" fill="orange" stroke="orange" stroke-width="3"/>
      <svg viewBox="0 0 30 30">
        <use href="${Icons}#pause" x="5" y="5"/>
    </svg>
    </svg>`;

    expect(circle).toEqual(expected);
  });

  it('should generate tooltip html', () => {
    const result = component.getTokenTooltipHtml('Add Token to Activity', 'id123');
    const expected = `<div id="tooltip-id123" class="overlay-tooltip">
                    <span class="overlay-tooltip-span">Add Token to Activity</span>
            </div>`;
    expect(result).toEqual(expected);
  });

  it('should get activity element and select when highlight current activity is called', () => {
    component.highlightActivityId('asdf');

    expect(component.selectionService.select).toHaveBeenCalledTimes(1);
  });

  it('should call remove on the overlays to clear a token', () => {
    component.clearToken('asdf');
    expect(component.overlays.remove).toHaveBeenCalledWith({ element: 'asdf' });
  });

  it('should call deselect on the selectionService when clearing a highlight', () => {
    component.clearActivityHighlight('asdf');
    expect(component.selectionService.deselect).toHaveBeenCalledWith({ width: 40 });
  });

  it('should add an incident graphic with tooltip to the overlay', async () => {
    const tokenOverlay = document.createElement('svg');
    const tooltipOverlay = document.createElement('svg');
    vi.spyOn(document, 'createElement').mockReturnValue(tokenOverlay);
    const addOverlaySpy = vi.spyOn(component.overlays, 'add').mockReturnValue(tooltipOverlay);
    const removeOverlaySpy = vi.spyOn(component.overlays, 'remove');
    component.addIncidentTokenToDiagram('asdf', 14);

    const expectedFormat = expect.objectContaining({
      html: expect.any(HTMLElement),
      position: expect.objectContaining({
        bottom: expect.any(Number),
        left: expect.any(Number),
      }),
    });

    const mouseEnterEvent = new Event('mouseenter');
    tokenOverlay.dispatchEvent(mouseEnterEvent);

    await vi.advanceTimersByTimeAsync(800);

    expect(addOverlaySpy).toHaveBeenCalledWith('asdf', {
      position: expect.objectContaining({
        bottom: expect.any(Number),
        left: expect.any(Number),
      }),
      html: expect.any(HTMLElement),
    });

    const mouseLeaveEvent = new Event('mouseleave');
    tokenOverlay.dispatchEvent(mouseLeaveEvent);

    await vi.runAllTimersAsync();

    expect(removeOverlaySpy).toHaveBeenCalledWith(tooltipOverlay);
    expect(component.overlays.add.mock.calls).toContainEqual(['asdf', expectedFormat]);
  });

  it('should add a suspended graphic with tooltip to the overlay', async () => {
    const tokenOverlay = document.createElement('svg');
    const tooltipOverlay = document.createElement('svg');
    vi.spyOn(document, 'createElement').mockReturnValue(tokenOverlay);
    const addOverlaySpy = vi.spyOn(component.overlays, 'add').mockReturnValue(tooltipOverlay);
    const removeOverlaySpy = vi.spyOn(component.overlays, 'remove');
    component.addSuspendToDiagram('asdf');

    const expectedFormat = expect.objectContaining({
      html: expect.any(HTMLElement),
      position: expect.objectContaining({
        top: expect.any(Number),
        right: expect.any(Number),
      }),
    });

    const mouseEnterEvent = new Event('mouseenter');
    tokenOverlay.dispatchEvent(mouseEnterEvent);

    await vi.advanceTimersByTimeAsync(800);

    expect(addOverlaySpy).toHaveBeenCalledWith('asdf', 'suspended-token', {
      position: expect.objectContaining({
        top: expect.any(Number),
        right: expect.any(Number),
      }),
      html: expect.any(HTMLElement),
    });

    const mouseLeaveEvent = new Event('mouseleave');
    tokenOverlay.dispatchEvent(mouseLeaveEvent);

    await vi.runAllTimersAsync();

    expect(removeOverlaySpy).toHaveBeenCalledWith(tooltipOverlay);
    expect(component.overlays.add.mock.calls).toContainEqual(['asdf', 'suspended-token', expectedFormat]);
  });

  it('should add a token with tooltip to the diagram', async () => {
    const tokenOverlay = document.createElement('svg');
    const tooltipOverlay = document.createElement('svg');
    vi.spyOn(document, 'createElement').mockReturnValue(tokenOverlay);
    const addOverlaySpy = vi.spyOn(component.overlays, 'add').mockReturnValue(tooltipOverlay);
    const removeOverlaySpy = vi.spyOn(component.overlays, 'remove');
    component.addTokenToDiagram('asdf', 1, 'active-token');

    const expectedFormat = expect.objectContaining({
      html: expect.any(HTMLElement),
      position: expect.objectContaining({
        bottom: expect.any(Number),
        left: expect.any(Number),
      }),
    });

    const mouseEnterEvent = new Event('mouseenter');
    tokenOverlay.dispatchEvent(mouseEnterEvent);

    await vi.advanceTimersByTimeAsync(800);

    expect(addOverlaySpy).toHaveBeenCalledWith('asdf', {
      position: expect.objectContaining({
        bottom: expect.any(Number),
        left: expect.any(Number),
      }),
      html: expect.any(HTMLElement),
    });

    const mouseLeaveEvent = new Event('mouseleave');
    tokenOverlay.dispatchEvent(mouseLeaveEvent);

    await vi.runAllTimersAsync();

    expect(removeOverlaySpy).toHaveBeenCalledWith(tooltipOverlay);
    expect(component.overlays.add.mock.calls).toContainEqual(['asdf', expectedFormat]);
  });

  it('should add a token to an activity', () => {
    const target = {
      id: 'asdf',
    };
    const expectedFormat = expect.objectContaining({
      html: expect.any(HTMLElement),
      position: expect.objectContaining({
        bottom: expect.any(Number),
        left: expect.any(Number),
      }),
    });

    component.overlayTokenOnShape(ContextMenuItemAction.REMOVE_TOKEN, target, false);

    expect(component.overlays.add).toHaveBeenCalledWith(
      target.id,
      ContextMenuItemAction.REMOVE_TOKEN.toString(),
      expectedFormat,
    );
  });

  it('should add a token to a flow', () => {
    const target = {
      id: 'asdf',
    };
    const expectedFormat = expect.objectContaining({
      html: expect.any(HTMLElement),
      position: expect.objectContaining({
        top: expect.any(Number),
        left: expect.any(Number),
      }),
    });

    component.overlayTokenOnShape(ContextMenuItemAction.ADD_TOKEN, target, true);

    expect(component.overlays.add).toHaveBeenCalledWith(
      target.id,
      ContextMenuItemAction.ADD_TOKEN.toString(),
      expectedFormat,
    );
  });

  it('should remove all token overlays', () => {
    component.removeAllTokenOverlays('asdf');
    expect(component.overlays.remove).toHaveBeenCalledWith({ type: ContextMenuItemAction.ADD_TOKEN, element: 'asdf' });
    expect(component.overlays.remove).toHaveBeenCalledWith({
      type: ContextMenuItemAction.REMOVE_TOKEN,
      element: 'asdf',
    });
  });

  it('should correctly toggle flow highlight', () => {
    vi.spyOn(DiagramOverlaysUtil.prototype, 'colorService', 'get').mockReturnValue({ drawConnection: vi.fn() });
    const testShapes = [{ id: '123', element: {} }];
    component.elementRegistry.get.mockReturnValue('element_123');
    component.colorFlows([]);
    expect(component.colorService?.drawConnection).toHaveBeenCalledTimes(0);

    component.colorFlows(testShapes, true);
    expect(component.colorService?.drawConnection).toHaveBeenCalledWith({}, 'element_123', {
      stroke: getBpmnColors('default').completedTokenStroke,
      fill: getBpmnColors('default').completedTokenStroke,
    });

    component.colorFlows(testShapes, false);
    expect(component.colorService?.drawConnection).toHaveBeenCalledWith({}, 'element_123', {
      fill: 'black',
      stroke: 'black',
    });
  });

  it('should add hovered marker on shape enter', () => {
    const shape = { id: 'elem1', label: { id: 'elem1_label' } };
    component.handleShapeEnter(shape);
    expect(component.canvas.addMarker).toHaveBeenCalledWith(shape, 'hovered');
    expect(component.canvas.addMarker).toHaveBeenCalledWith(shape.label, 'hovered');
  });

  it('should add hovered marker on label enter', () => {
    const shape = { id: 'elem1_label', type: 'label', labelTarget: { id: 'elem1' } };
    component.handleShapeEnter(shape);
    expect(component.canvas.addMarker).toHaveBeenCalledWith(shape, 'hovered');
    expect(component.canvas.addMarker).toHaveBeenCalledWith(shape.labelTarget, 'hovered');
  });

  it('should remove hovered marker on shape exit', () => {
    const shape = { id: 'elem2', label: { id: 'elem2_label' } };
    component.handleShapeExit(shape);
    expect(component.canvas.removeMarker).toHaveBeenCalledWith(shape, 'hovered');
    expect(component.canvas.removeMarker).toHaveBeenCalledWith(shape.label, 'hovered');
  });

  it('should remove hovered marker on label exit', () => {
    const shape = { id: 'elem2_label', type: 'label', labelTarget: { id: 'elem2' } };
    component.handleShapeExit(shape);
    expect(component.canvas.removeMarker).toHaveBeenCalledWith(shape, 'hovered');
    expect(component.canvas.removeMarker).toHaveBeenCalledWith(shape.labelTarget, 'hovered');
  });

  describe('updateDiagramOpacity', () => {
    it('should dim non-selected elements and undim selected', () => {
      const elem1 = { id: 'elem_1', label: {} };
      const elem1_label = { id: 'elem_1_label', type: 'label', labelTarget: elem1 };
      elem1.label = elem1_label;
      const elem2 = { id: 'other_2', label: {} };
      const elem2_label = { id: 'other_2_label', type: 'label', labelTarget: elem2 };
      elem2.label = elem2_label;
      component.elementRegistry.getAll = vi.fn().mockReturnValue([elem1, elem1_label, elem2, elem2_label]);
      component.canvas.addMarker = vi.fn();
      component.canvas.removeMarker = vi.fn();

      component.updateDiagramOpacity('elem_1');

      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem1, 'dimmed');
      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem1_label, 'dimmed');
      expect(component.canvas.addMarker).toHaveBeenCalledWith(elem2, 'dimmed');
      expect(component.canvas.addMarker).toHaveBeenCalledWith(elem2_label, 'dimmed');
    });

    it('should undim all elements when no selection is provided', () => {
      const elem1 = { id: 'a_1' };
      const elem1_label = { id: 'a_1_label', type: 'label', labelTarget: elem1 };
      const elem2 = { id: 'b_2' };
      const elem2_label = { id: 'b_2_label', type: 'label', labelTarget: elem2 };
      component.elementRegistry.getAll = vi.fn().mockReturnValue([elem1, elem1_label, elem2, elem2_label]);
      component.canvas.removeMarker = vi.fn();
      component.canvas.addMarker = vi.fn();

      component.updateDiagramOpacity();

      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem1, 'dimmed');
      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem1_label, 'dimmed');
      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem2, 'dimmed');
      expect(component.canvas.removeMarker).toHaveBeenCalledWith(elem2_label, 'dimmed');
      expect(component.canvas.addMarker).not.toHaveBeenCalled();
    });
  });
});
