import { Dimensions, Point } from 'diagram-js/lib/util/Types';

export class DiagramAnimationUtil {
  /**
   * This method takes a `progress` parameter (ranging from 0 to 1) and returns a modified
   * progress value to create a smooth animation effect. The easing function accelerates
   * the animation at the start (ease-in), decelerates it at the end (ease-out), and ensures
   * a smooth transition between the two phases (ease-in-out).
   *
   * How it works:
   * - If `progress` is less than 0.5 (first half of the animation):
   *   - The function calculates an "ease-in" effect using a cubic function: `4 * progress^3`.
   *   - This causes the animation to start slowly and accelerate.
   * - If `progress` is greater than or equal to 0.5 (second half of the animation):
   *   - The function calculates an "ease-out" effect using a complementary cubic function:
   *     `1 - ((-2 * progress + 2)^3) / 2`.
   *   - This causes the animation to decelerate smoothly.
   *
   * The result is a symmetric easing curve that provides a natural and visually pleasing
   * acceleration and deceleration for animations.
   *
   * @param progress - A number between 0 and 1 representing the current progress of the animation.
   * @returns A modified progress value based on the ease-in-out cubic easing function.
   */
  private static easeInOut(progress: number): number {
    return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  static async animatePan(
    canvas: any,
    startViewbox: Dimensions & Point,
    endViewbox: Dimensions & Point,
    duration: number,
  ): Promise<void> {
    await this.animateProperty(duration, (easedProgress) => {
      const interpolatedViewbox = {
        x: startViewbox.x + easedProgress * (endViewbox.x - startViewbox.x),
        y: startViewbox.y + easedProgress * (endViewbox.y - startViewbox.y),
        width: startViewbox.width,
        height: startViewbox.height,
      };

      canvas.viewbox(interpolatedViewbox);
    });
  }

  static async animateZoom(canvas: any, targetZoom: number, duration: number): Promise<void> {
    const startZoom = canvas.zoom();
    const zoomDelta = targetZoom - startZoom;

    await this.animateProperty(duration, (easedProgress) => {
      canvas.zoom(startZoom + easedProgress * zoomDelta);
    });
  }

  private static async animateProperty(duration: number, updateCallback: (progress: number) => void): Promise<void> {
    return new Promise<void>((resolve) => {
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.easeInOut(progress);

        updateCallback(easedProgress);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }
}
