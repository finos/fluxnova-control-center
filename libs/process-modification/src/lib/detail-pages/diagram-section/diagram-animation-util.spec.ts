import { describe, expect, it, vi } from 'vitest';
import { DiagramAnimationUtil } from './diagram-animation-util';

describe('DiagramAnimationUtil', () => {
  describe('easeInOut', () => {
    it('should return 0 for progress = 0', () => {
      const result = (DiagramAnimationUtil as any).easeInOut(0);
      expect(result).toBe(0);
    });

    it('should return 1 for progress = 1', () => {
      const result = (DiagramAnimationUtil as any).easeInOut(1);
      expect(result).toBe(1);
    });

    it('should return a value less than 0.5 for progress < 0.5', () => {
      const result = (DiagramAnimationUtil as any).easeInOut(0.25);
      expect(result).toBeLessThan(0.5);
    });

    it('should return a value greater than 0.5 for progress > 0.5', () => {
      const result = (DiagramAnimationUtil as any).easeInOut(0.75);
      expect(result).toBeGreaterThan(0.5);
    });

    it('should provide a smooth transition between ease-in and ease-out phases', () => {
      const result1 = (DiagramAnimationUtil as any).easeInOut(0.49);
      const result2 = (DiagramAnimationUtil as any).easeInOut(0.51);
      expect(result1).toBeLessThan(result2);
    });
  });

  describe('animatePan', () => {
    it('should interpolate viewbox values over time', async () => {
      const mockCanvas = {
        viewbox: vi.fn(),
      };

      const startViewbox = { x: 0, y: 0, width: 100, height: 100 };
      const endViewbox = { x: 50, y: 50, width: 100, height: 100 };
      const duration = 100;

      await DiagramAnimationUtil.animatePan(mockCanvas, startViewbox, endViewbox, duration);

      expect(mockCanvas.viewbox).toHaveBeenCalled();
      expect(mockCanvas.viewbox).toHaveBeenCalledWith(expect.objectContaining({ x: 50, y: 50 }));
    });
  });

  describe('animateZoom', () => {
    it('should interpolate zoom values over time', async () => {
      const mockCanvas = {
        zoom: vi.fn().mockReturnValue(1),
      };

      const targetZoom = 2;
      const duration = 100;

      await DiagramAnimationUtil.animateZoom(mockCanvas, targetZoom, duration);

      expect(mockCanvas.zoom).toHaveBeenCalled();
      expect(mockCanvas.zoom).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('animateProperty', () => {
    it('should call updateCallback with eased progress values', async () => {
      const updateCallback = vi.fn();
      const duration = 100;

      await (DiagramAnimationUtil as any).animateProperty(duration, updateCallback);

      expect(updateCallback).toHaveBeenCalled();
      expect(updateCallback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should resolve the promise after the animation completes', async () => {
      const updateCallback = vi.fn();
      const duration = 100;

      const startTime = performance.now();
      await (DiagramAnimationUtil as any).animateProperty(duration, updateCallback);
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(duration);
    });
  });
});
