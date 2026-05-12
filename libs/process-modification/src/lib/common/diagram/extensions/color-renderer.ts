'use strict';

import { BpmnColors, getBpmnColors } from '@fxn/common';
import { default as BpmnRenderer } from 'bpmn-js/lib/draw/BpmnRenderer';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { default as BaseRenderer } from 'diagram-js/lib/draw/BaseRenderer';
import inherits from 'inherits';
import { assign } from 'lodash-es';
import { append, attr, create } from 'tiny-svg';

// this sections is for production builds that incorrectly remove the inherits functionality from the build optimizer
// https://github.com/angular/angular-cli/issues/11439
if ((<any>BpmnRenderer).super_ === undefined) {
  const protoCanRender = BpmnRenderer.prototype.canRender;
  const protoDrawConnection = BpmnRenderer.prototype.drawConnection;
  const protoDrawShape = BpmnRenderer.prototype.drawShape;
  const protoGetShapePath = BpmnRenderer.prototype.getShapePath;
  inherits(BpmnRenderer, BaseRenderer);
  BpmnRenderer.prototype.canRender = protoCanRender;
  BpmnRenderer.prototype.drawConnection = protoDrawConnection;
  BpmnRenderer.prototype.drawShape = protoDrawShape;
  BpmnRenderer.prototype.getShapePath = protoGetShapePath;
}

export class ColorRenderer extends BpmnRenderer {
  private originalDrawShape: (visuals: any, element: any) => any;
  private originalDrawConnection: (parentGfx: any, element: any, attrs: any) => any;
  private colors: BpmnColors = getBpmnColors();
  private markers: { [key: string]: any } = {};
  private canvas: any;

  constructor(config: any, eventBus: any, styles: any, pathMap: any, canvas: any, textRenderer: any, priority: any) {
    super(config, eventBus, styles, pathMap, canvas, textRenderer, priority || 1200);
    this.canvas = canvas;

    this.originalDrawShape = this.drawShape;
    this.originalDrawConnection = this.drawConnection;

    this.drawShape = (visuals: any, element: any) => {
      const result = this.originalDrawShape.call(this, visuals, element);

      if (
        is(element, 'bpmn:Activity') ||
        is(element, 'bpmn:IntermediateThrowEvent') ||
        is(element, 'bpmn:IntermediateCatchEvent')
      ) {
        this.swapAllColors(result, 'black', this.colors.activityStroke);
        this.swapAllColors(result, 'white', this.colors.activityFill);
      } else if (is(element, 'bpmn:StartEvent')) {
        this.swapAllColors(result, 'black', this.colors.startEventStroke);
        this.swapAllColors(result, 'white', this.colors.startEventFill);
      } else if (is(element, 'bpmn:EndEvent')) {
        this.swapAllColors(result, 'black', this.colors.endEventStroke);
        this.swapAllColors(result, 'white', this.colors.endEventFill);
      } else if (
        is(element, 'bpmn:ParallelGateway') ||
        is(element, 'bpmn:ExclusiveGateway') ||
        is(element, 'bpmn:EventBasedGateway') ||
        is(element, 'bpmn:ComplexGateway') ||
        is(element, 'bpmn:InclusiveGateway')
      ) {
        this.swapAllColors(result, 'black', this.colors.gatewayStroke);
        this.swapAllColors(result, 'white', this.colors.gatewayFill);
      } else if (is(element, 'bpmn:SequenceFlow') || is(element, 'bpmn:MessageFlow')) {
        this.swapAllColors(result, 'black', this.colors.flowStroke);
      }
      return result;
    };

    this.drawConnection = (parentGfx: any, element: any, attrs: { fill: string; stroke: string }) => {
      const result = this.originalDrawConnection.call(this, parentGfx, element, attrs);

      if (is(element, 'bpmn:SequenceFlow')) {
        this.swapAllColors(result, 'black', attrs.stroke);
        const newEnd = this.marker('sequenceflow-end', attrs.fill, attrs.stroke);
        attr(result, 'marker-end', newEnd);
      }
      return result;
    };
  }

  /*
  The marker functions were pulled directly from bpmn-js -- BpmnRenderer.js
  These are not part of the renderer interface, so we need to re-implement them rather than just override
   */
  private marker(type: string, fill: string, stroke: string) {
    const id = `${type}-${fill}-${stroke}`;
    if (!this.markers[id]) {
      this.createMarker(id, type, fill, stroke);
    }
    return `url(#${id})`;
  }

  private createMarker(id: string, type: string, fill: string, stroke: string) {
    if (type === 'sequenceflow-end') {
      const sequenceflowEnd = create('path');
      attr(sequenceflowEnd, { d: 'M 1 5 L 11 10 L 1 15 Z' });

      this.addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill,
          stroke,
        },
      });
    }
  }

  private addMarker(id: string, options: any) {
    const attrs = assign(
      {
        fill: 'black',
        strokeWidth: 1,
        strokeLinecap: 'round',
        strokeDasharray: 'none',
      },
      options.attrs,
    );
    const ref = options.ref || { x: 0, y: 0 };
    const scale = options.scale || 1;
    // fix for safari / chrome / firefox bug not correctly resetting stroke dash array
    if (attrs.strokeDasharray === 'none') {
      attrs.strokeDasharray = [10000, 1];
    }
    const marker = create('marker');
    attr(options.element, attrs);
    append(marker, options.element);
    attr(marker, {
      id,
      viewBox: '0 0 20 20',
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: 'auto',
    });
    let defs = this.canvas._svg.querySelector('defs');
    if (!defs) {
      defs = create('defs');
      append(this.canvas._svg, defs);
    }
    append(defs, marker);
    this.markers[id] = marker;
  }

  private swapColors(svgElement: any, originalColor: string, newColor: string) {
    if (attr(svgElement, 'stroke') === originalColor) {
      attr(svgElement, 'stroke', newColor);
    }
    if (attr(svgElement, 'fill') === originalColor) {
      attr(svgElement, 'fill', newColor);
    }
  }

  private swapAllColors(svgElement: any, originalColor: string, newColor: string) {
    this.swapColors(svgElement, originalColor, newColor);
    let sibling = svgElement.nextSibling;
    while (sibling != null) {
      this.swapColors(sibling, originalColor, newColor);
      sibling = sibling.nextSibling;
    }
  }

  setColors(colors: BpmnColors) {
    this.colors = colors;
  }
}
(<any>ColorRenderer).$inject = ['config', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];
