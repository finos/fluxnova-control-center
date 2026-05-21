/* eslint-disable max-lines */
import Heatmap, { HeatmapData, HeatmapParams } from 'visual-heatmap';
import NavigatedViewer from 'bpmn-js/lib/Viewer';
import ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import { formatMsToLargestTimeUnit } from '@fxn/common';
import { ShapeLike } from 'bpmn-js/lib/draw/BpmnRenderUtil';

export class HeatmapUtil {
  private static shapeEnterHandlers: { [activityId: string]: () => void } = {};
  private static shapeLeaveHandlers: { [activityId: string]: () => void } = {};
  private static MIN_MAX_VALUE = 10;
  private static MIN_NUM_POINTS_IN_SHAPE = 3;
  private static POINT_RADIUS = 17.5;

  public static ZOOM_LEVEL = 1;

  /**
   * Renders a heatmap overlay on a BPMN diagram based on provided activity data
   * @param {Heatmap} heatmapInstance - The heatmap instance to render with
   * @param {HeatmapData} data - The heatmap data containing count and duration information
   * @param {HeatmapParams} params - Parameters for configuring the heatmap visualization
   * @param {NavigatedViewer} navigatedViewer - The BPMN diagram viewer instance
   * @returns {Heatmap} The rendered heatmap instance
   */
  public static renderHeatmap(
    heatmapInstance: Heatmap,
    data: HeatmapData,
    params: HeatmapParams,
    navigatedViewer: NavigatedViewer,
  ) {
    const dataPoints: { x: number; y: number; value: number; radius: number }[] = [];
    const activityInstances = params.viewBy === 'timeSpent' ? data.averageDuration : data.count;
    const canvas: any = navigatedViewer.get('canvas');

    const maxDataValue = Math.max(...Object.values(activityInstances), 100);
    const maxHours = Math.max(100, maxDataValue / 3600000);
    heatmapInstance.setMin(0);
    heatmapInstance.setMax(100);

    const excludedTypes = [
      'label',
      'bpmn:Lane',
      'bpmn:Participant',
      'bpmn:SubProcess',
      'bpmn:Transaction',
      'bpmn:Process',
    ];

    navigatedViewer
      .get<ElementRegistry>('elementRegistry')
      .getAll()
      .filter(
        (shape: ShapeLike) =>
          (shape.type === 'bpmn:SequenceFlow' &&
            data.count[shape.source.businessObject.id] > 0 &&
            data.count[shape.target.businessObject.id] > 0) ||
          (data.count[shape.businessObject.id] > 0 && !excludedTypes.includes(shape.type)),
      )
      .forEach((shape: ShapeLike) => {
        if (shape.type === 'bpmn:SequenceFlow') {
          const sourceValue = activityInstances[shape.source.businessObject.id] ?? 0;
          const targetValue = activityInstances[shape.target.businessObject.id] ?? 0;
          const sourceNormalizedValue =
            params.viewBy === 'timeSpent'
              ? this.scaleDurationValue(sourceValue, maxHours)
              : this.scaleCountValue(sourceValue, maxDataValue);
          const targetNormalizedValue =
            params.viewBy === 'timeSpent'
              ? this.scaleDurationValue(targetValue, maxHours)
              : this.scaleCountValue(targetValue, maxDataValue);
          this.generateSequenceFlowPoints(shape, sourceNormalizedValue, targetNormalizedValue, dataPoints, canvas);
        } else if (shape.type.includes('Event')) {
          const value = activityInstances[shape.businessObject.id] ?? 0;
          const normalizedValue =
            params.viewBy === 'timeSpent'
              ? this.scaleDurationValue(value, maxHours)
              : this.scaleCountValue(value, maxDataValue);
          this.generateEventPoints(shape, normalizedValue, dataPoints, canvas);
        } else if (shape.type.includes('Gateway')) {
          const value = activityInstances[shape.businessObject.id] ?? 0;
          const normalizedValue =
            params.viewBy === 'timeSpent'
              ? this.scaleDurationValue(value, maxHours)
              : this.scaleCountValue(value, maxDataValue);
          this.generateGatewayPoints(shape, normalizedValue, dataPoints, canvas);
        } else {
          const value = activityInstances[shape.businessObject.id] ?? 0;
          const normalizedValue =
            params.viewBy === 'timeSpent'
              ? this.scaleDurationValue(value, maxHours)
              : this.scaleCountValue(value, maxDataValue);
          this.generateTaskPoints(shape, normalizedValue, dataPoints, canvas);
        }
        const instanceValue = activityInstances[shape.businessObject.id] ?? 0;
        const tooltipText =
          params.viewBy === 'timeSpent'
            ? `Average Duration: ${formatMsToLargestTimeUnit(instanceValue)}`
            : `Count: ${instanceValue}`;
        this.setupHeatmapTooltip(shape, tooltipText, navigatedViewer);
      });

    heatmapInstance.renderData(dataPoints);
    return heatmapInstance;
  }

  /**
   * Sets up tooltip functionality for a BPMN element in the heatmap
   * @param {ShapeLike} shape - The BPMN shape to attach the tooltip to
   * @param {string} tooltipText - The text to display in the tooltip
   * @param {NavigatedViewer} navigatedViewer - The BPMN viewer instance
   */
  private static setupHeatmapTooltip(shape: ShapeLike, tooltipText: string, navigatedViewer: NavigatedViewer) {
    const tooltip = document.querySelector('#heatmap-tooltip') as HTMLElement;
    if (tooltip) {
      const canvas: any = navigatedViewer.get('canvas');
      const diagramEventBus: any = navigatedViewer.get('eventBus');
      const beforeHeight = 7; // Height of ::before element in tooltip
      const tooltipViewboxChangeHandler = () => {
        const newBoundingBox = canvas.getAbsoluteBBox(shape);
        tooltip.style.left = `${newBoundingBox.x + newBoundingBox.width / 2 - tooltip.clientWidth / 2}px`;
        tooltip.style.top = `${newBoundingBox.y - tooltip.offsetHeight - beforeHeight}px`;
      };
      this.shapeEnterHandlers[shape.businessObject.id] = () => {
        const currBoundingBox = canvas.getAbsoluteBBox(shape);
        tooltip.style.opacity = '1';

        const tooltipSpan = tooltip.querySelector('span');
        if (tooltipSpan) {
          tooltipSpan.textContent = tooltipText;
        }
        tooltip.style.left = `${currBoundingBox.x + currBoundingBox.width / 2 - tooltip.clientWidth / 2}px`;
        tooltip.style.top = `${currBoundingBox.y - tooltip.offsetHeight - beforeHeight}px`;
        diagramEventBus.on('canvas.viewbox.changed', tooltipViewboxChangeHandler);
      };
      this.shapeLeaveHandlers[shape.businessObject.id] = () => {
        tooltip.style.opacity = '0';
        diagramEventBus.off('canvas.viewbox.changed', tooltipViewboxChangeHandler);
      };
      canvas.getGraphics(shape).addEventListener('mouseenter', this.shapeEnterHandlers[shape.businessObject.id]);
      canvas.getGraphics(shape).addEventListener('mouseleave', this.shapeLeaveHandlers[shape.businessObject.id]);
    }
  }

  /**
   * Removes all tooltip event listeners and hides any visible tooltips
   * @param {NavigatedViewer} navigatedViewer - The BPMN viewer instance
   */
  public static cleanupHeatmapTooltip(navigatedViewer: NavigatedViewer) {
    const canvas: any = navigatedViewer.get('canvas');
    Object.keys(this.shapeEnterHandlers).forEach((activityId) => {
      canvas.getGraphics(activityId)?.removeEventListener('mouseenter', this.shapeEnterHandlers[activityId]);
    });
    Object.keys(this.shapeLeaveHandlers).forEach((activityId) => {
      canvas.getGraphics(activityId)?.removeEventListener('mouseleave', this.shapeLeaveHandlers[activityId]);
    });

    const tooltip = document.querySelector('#heatmap-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  }

  /**
   * Generates heatmap data points for task (rectangular) elements in the BPMN diagram
   * It tries to create an evenly spread grid of points within the rectangle shape.
   * @param {ShapeLike} shape - The BPMN task shape
   * @param {number} normalizedInstanceValue - The normalized intensity value for this task
   * @param {Array} data - Array to populate with heatmap data points
   * @param {any} canvas - The BPMN canvas instance
   * @returns {Array} The updated array of heatmap data points
   */
  private static generateTaskPoints(
    shape: ShapeLike,
    normalizedInstanceValue: number,
    data: { x: number; y: number; value: number; radius: number }[],
    canvas: any,
  ) {
    const bbox = canvas.getAbsoluteBBox(shape);

    const bleedPercentage = 0.15; // 15% bleed
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const bleedX = bbox.width * bleedPercentage;
    const bleedY = bbox.height * bleedPercentage;

    const extendedBbox = {
      x: bbox.x - bleedX / 2,
      y: bbox.y - bleedY / 2,
      width: bbox.width + bleedX,
      height: bbox.height + bleedY,
    };
    const spacing = 6 * this.ZOOM_LEVEL;
    const pointsX = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(extendedBbox.width / spacing));
    const pointsY = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(extendedBbox.height / spacing));
    const actualSpacingX = extendedBbox.width / (pointsX - 1);
    const actualSpacingY = extendedBbox.height / (pointsY - 1);

    for (let i = 0; i < pointsX; i++) {
      for (let j = 0; j < pointsY; j++) {
        const x = extendedBbox.x + i * actualSpacingX;
        const y = extendedBbox.y + j * actualSpacingY;

        const pointValue = this.calculatePointValue({
          x: x,
          y: y,
          centerX: centerX,
          centerY: centerY,
          width: extendedBbox.width,
          height: extendedBbox.height,
          minValue: 0,
          maxValue: normalizedInstanceValue * 2 + this.MIN_MAX_VALUE,
        });

        data.push({
          x,
          y,
          value: pointValue,
          radius: this.POINT_RADIUS,
        });
      }
    }

    return data;
  }

  /**
   * Generates heatmap data points for event elements (circles) in the BPMN diagram
   * It tries to create an evenly spread grid of points within the circle shape.
   * @param {ShapeLike} shape - The BPMN event shape
   * @param {number} normalizedInstanceValue - The normalized intensity value for this event
   * @param {Array} data - Array to populate with heatmap data points
   * @param {any} canvas - The BPMN canvas instance
   * @returns {Array} The updated array of heatmap data points
   */
  private static generateEventPoints(
    shape: ShapeLike,
    normalizedInstanceValue: number,
    data: { x: number; y: number; value: number; radius: number }[],
    canvas: any,
  ) {
    const bbox = canvas.getAbsoluteBBox(shape);

    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const radius = bbox.width / 2;

    const spacing = 5.5 * this.ZOOM_LEVEL;

    const gridWidth = radius * 2;
    const gridHeight = radius * 2;

    const pointsX = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(gridWidth / spacing));
    const pointsY = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(gridHeight / spacing));

    const actualSpacingX = gridWidth / (pointsX - 1);
    const actualSpacingY = gridHeight / (pointsY - 1);

    for (let i = 0; i < pointsX; i++) {
      for (let j = 0; j < pointsY; j++) {
        const x = centerX - radius + i * actualSpacingX;
        const y = centerY - radius + j * actualSpacingY;

        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        const pointValue = this.calculatePointValue({
          x: x,
          y: y,
          centerX: centerX,
          centerY: centerY,
          width: gridWidth,
          height: gridHeight,
          minValue: 2,
          maxValue: normalizedInstanceValue * 2 + this.MIN_MAX_VALUE,
        });

        // Check if point is within the circle
        if (distance <= radius) {
          data.push({
            x,
            y,
            value: pointValue,
            radius: this.POINT_RADIUS,
          });
        }
      }
    }

    return data;
  }

  /**
   * Generates heatmap data points for gateway elements (diamonds) in the BPMN diagram
   * It tries to create an evenly spread grid of points within the diamond shape.
   * @param {ShapeLike} shape - The BPMN gateway shape
   * @param {number} normalizedInstanceValue - The normalized intensity value for this gateway
   * @param {Array} data - Array to populate with heatmap data points
   * @param {any} canvas - The BPMN canvas instance
   * @returns {Array} The updated array of heatmap data points
   */
  private static generateGatewayPoints(
    shape: ShapeLike,
    normalizedInstanceValue: number,
    data: { x: number; y: number; value: number; radius: number }[],
    canvas: any,
  ) {
    const bbox = canvas.getAbsoluteBBox(shape);

    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    const diamond = {
      top: { x: centerX, y: bbox.y },
      right: { x: bbox.x + bbox.width, y: centerY },
      bottom: { x: centerX, y: bbox.y + bbox.height },
      left: { x: bbox.x, y: centerY },
    };

    const width = diamond.right.x - diamond.left.x;
    const height = diamond.bottom.y - diamond.top.y;
    const spacing = 5.5 * this.ZOOM_LEVEL;

    const pointsX = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(width / spacing));
    const pointsY = Math.max(this.MIN_NUM_POINTS_IN_SHAPE, Math.floor(height / spacing));

    const actualSpacingX = width / (pointsX - 1);
    const actualSpacingY = height / (pointsY - 1);

    for (let i = 0; i < pointsX; i++) {
      for (let j = 0; j < pointsY; j++) {
        const x = diamond.left.x + i * actualSpacingX;
        const y = diamond.top.y + j * actualSpacingY;

        const normalizedX = Math.abs(x - centerX) / (width / 2);
        const normalizedY = Math.abs(y - centerY) / (height / 2);

        const pointValue = this.calculatePointValue({
          x: x,
          y: y,
          centerX: centerX,
          centerY: centerY,
          width: bbox.width,
          height: bbox.height,
          minValue: 2,
          maxValue: normalizedInstanceValue * 2 + this.MIN_MAX_VALUE,
        });

        // Check if point is within the diamond
        if (normalizedX + normalizedY <= 1.0) {
          data.push({
            x,
            y,
            value: pointValue,
            radius: this.POINT_RADIUS,
          });
        }
      }
    }

    return data;
  }

  /**
   * Generates heatmap data points along sequence flow connectors in the BPMN diagram
   * It will generate evenly spread heatmap points over the distance of the sequence flow path.
   * @param {ShapeLike} shape - The BPMN sequence flow shape
   * @param {number} normalizedSourceValue - The normalized intensity value for the source element
   * @param {number} normalizedTargetValue - The normalized intensity value for the target element
   * @param {Array} data - Array to populate with heatmap data points
   * @param {any} canvas - The BPMN canvas instance
   * @returns {Array} The updated array of heatmap data points
   */
  private static generateSequenceFlowPoints(
    shape: ShapeLike,
    normalizedSourceValue: number,
    normalizedTargetValue: number,
    data: { x: number; y: number; value: number; radius: number }[],
    canvas: any,
  ) {
    const screenWaypoints = shape.waypoints || [];
    const diagramWaypoints = [];

    // Waypoints are stored in screen coordinates, convert them to diagram coordinates
    for (const screenWaypoint of screenWaypoints) {
      diagramWaypoints.push(this.diagramToCanvasPoint(screenWaypoint, canvas));
    }

    if (diagramWaypoints.length < 2) {
      return data;
    }

    let totalPathLength = 0;
    for (let i = 1; i < diagramWaypoints.length; i++) {
      const dx = diagramWaypoints[i].x - diagramWaypoints[i - 1].x;
      const dy = diagramWaypoints[i].y - diagramWaypoints[i - 1].y;
      totalPathLength += Math.sqrt(dx * dx + dy * dy);
    }
    const minValue = 10;
    const pointsPerUnit = 0.2 / this.ZOOM_LEVEL;
    const pointCount = Math.ceil(totalPathLength * pointsPerUnit);

    const cumulativeDistances = [0];
    let cumulativeDistance = 0;

    for (let i = 1; i < diagramWaypoints.length; i++) {
      const dx = diagramWaypoints[i].x - diagramWaypoints[i - 1].x;
      const dy = diagramWaypoints[i].y - diagramWaypoints[i - 1].y;
      cumulativeDistance += Math.sqrt(dx * dx + dy * dy);
      cumulativeDistances.push(cumulativeDistance);
    }

    for (let i = 1; i < diagramWaypoints.length; i++) {
      const start = diagramWaypoints[i - 1];
      const end = diagramWaypoints[i];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      const segmentStartPos = cumulativeDistances[i - 1] / totalPathLength;
      const segmentEndPos = cumulativeDistances[i] / totalPathLength;

      const segmentPointCount = Math.ceil((segmentLength / totalPathLength) * pointCount);

      for (let j = 0; j <= segmentPointCount; j++) {
        const segmentT = j / segmentPointCount;
        const x = start.x + dx * segmentT;
        const y = start.y + dy * segmentT;

        const pathPosition = segmentStartPos + (segmentEndPos - segmentStartPos) * segmentT;
        const minSourceTargetValue = 5;

        const pointValue =
          minValue +
          (Math.max(normalizedSourceValue, minSourceTargetValue) * (1 - pathPosition) +
            Math.max(normalizedTargetValue, minSourceTargetValue) * pathPosition -
            minValue);

        data.push({
          x,
          y,
          value: pointValue,
          radius: this.POINT_RADIUS,
        });
      }
    }

    return data;
  }

  /**
   * Scales time values in milliseconds to a 0-100 scale with specific ranges for time units
   *
   * @param {number} milliseconds - The time duration in milliseconds
   * @param {number} maxHours - Maximum number of hours to consider (default: 100)
   * @returns {number} Scaled value between 0 and 100
   */
  private static scaleDurationValue(milliseconds: number, maxHours = 100) {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const MAX_MS = maxHours * HOUR;

    if (milliseconds < 0.001) return 0;
    if (milliseconds >= MAX_MS) return 100;

    const msRange = { start: 0, end: 10 };
    const secondRange = { start: 10, end: 20 };
    const minuteRange = { start: 20, end: 30 };
    const hourRange = { start: 30, end: 100 };

    if (milliseconds < SECOND) {
      return msRange.end * (milliseconds / SECOND);
    } else if (milliseconds < MINUTE) {
      return secondRange.start + (secondRange.end - secondRange.start) * ((milliseconds - SECOND) / (MINUTE - SECOND));
    } else if (milliseconds < HOUR) {
      return minuteRange.start + (minuteRange.end - minuteRange.start) * ((milliseconds - MINUTE) / (HOUR - MINUTE));
    } else {
      return hourRange.start + ((hourRange.end - hourRange.start) * (milliseconds - HOUR)) / (MAX_MS - HOUR);
    }
  }

  /**
   * Scales count values to a 0-100 scale with specific ranges to best match heatmap
   *
   * @param {number} count - The instance count on the shape
   * @param {number} maxCount - Maximum count to consider (default: 100)
   * @returns {number} Scaled value between 0 and 100
   */
  private static scaleCountValue(count: number, maxCount = 100) {
    const LOW = Math.floor(maxCount * 0.25);
    const MEDIUM = Math.floor(maxCount * 0.5);
    const HIGH = Math.floor(maxCount * 0.75);

    if (count === 0) return 0;
    if (count >= maxCount) return 100;

    const lowRange = { start: 0, end: 10 };
    const mediumRange = { start: 10, end: 20 };
    const highRange = { start: 20, end: 30 };
    const criticalRange = { start: 30, end: 100 };

    if (count < LOW) {
      return lowRange.end * (count / LOW);
    } else if (count < MEDIUM) {
      return mediumRange.start + (mediumRange.end - mediumRange.start) * ((count - LOW) / (MEDIUM - LOW));
    } else if (count < HIGH) {
      return highRange.start + (highRange.end - highRange.start) * ((count - MEDIUM) / (HIGH - MEDIUM));
    } else {
      return criticalRange.start + ((criticalRange.end - criticalRange.start) * (count - HIGH)) / (maxCount - HIGH);
    }
  }

  /**
   * Converts a point from diagram space to canvas space
   * @param {Object} point - The point in diagram space with x and y coordinates
   * @returns {Object} The point in canvas space with x and y coordinates
   */
  private static diagramToCanvasPoint(point: { x: number; y: number }, canvas: any): { x: number; y: number } {
    const viewbox = canvas.viewbox();
    const transformed = {
      x: (point.x - viewbox.x) * viewbox.scale,
      y: (point.y - viewbox.y) * viewbox.scale,
    };

    return transformed;
  }

  /**
   * Calculates point value based on its distance from the center of the shape
   * @param {number} x - X coordinate of the point
   * @param {number} y - Y coordinate of the point
   * @param {number} centerX - X coordinate of the center of the shape
   * @param {number} centerY - Y coordinate of the center of the shape
   * @param {number} width - Width of the shape
   * @param {number} height - Height of the shape
   * @param {number} minValue - Minimum value for the point
   * @param {number} maxValue - Maximum value for the point
   */
  private static calculatePointValue({
    x,
    y,
    centerX,
    centerY,
    width,
    height,
    minValue,
    maxValue,
  }: {
    x: number;
    y: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    minValue: number;
    maxValue: number;
  }): number {
    const distanceX = Math.abs(x - centerX);
    const distanceY = Math.abs(y - centerY);

    const normalizedDistanceX = Math.min(1, distanceX / (width / 2));
    const normalizedDistanceY = Math.min(1, distanceY / (height / 2));

    const normalizedDistance = Math.sqrt(
      (normalizedDistanceX * normalizedDistanceX + normalizedDistanceY * normalizedDistanceY) / 2,
    );

    return minValue + (maxValue - minValue) * (1 - normalizedDistance);
  }
}
