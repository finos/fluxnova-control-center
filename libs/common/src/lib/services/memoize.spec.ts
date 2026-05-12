import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { memoize } from './memoize';

vi.useFakeTimers();

describe('memoize', () => {
  it('should cache results for identical arguments', () => {
    const fn = vi.fn((x: number) => of(x));
    const memoized = memoize(fn);
    const result1 = memoized(1);
    const result2 = memoized(1);
    expect(result1).toBe(result2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call the original function only once for the same arguments within the cache timeout', () => {
    const fn = vi.fn((x: number) => of(x));
    const memoized = memoize(fn);
    memoized(2);
    memoized(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should invalidate the cache after the timeout', () => {
    const fn = vi.fn((x: number) => of(x));
    const memoized = memoize(fn, 1000);
    memoized(3);
    vi.advanceTimersByTime(1001);
    memoized(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle different arguments as separate cache entries', () => {
    const fn = vi.fn((x: number) => of(x));
    const memoized = memoize(fn);
    memoized(4);
    memoized(5);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should work with observables and shareReplay', async () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return of(x).pipe(delay(10));
    };
    const memoized = memoize(fn);
    const obs1 = memoized(6);
    const obs2 = memoized(6);

    const promise1 = new Promise<number>((resolve) => {
      obs1.subscribe((val: number) => resolve(val));
    });

    const promise2 = new Promise<number>((resolve) => {
      obs2.subscribe((val: number) => resolve(val));
    });

    vi.advanceTimersByTime(11);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe(6);
    expect(result2).toBe(6);
    expect(callCount).toBe(1);
  });

  it('should not share cache between different memoized functions', () => {
    const fn1 = vi.fn((x: number) => of(x));
    const fn2 = vi.fn((x: number) => of(x));
    const memoized1 = memoize(fn1);
    const memoized2 = memoize(fn2);
    memoized1(7);
    memoized2(7);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});
