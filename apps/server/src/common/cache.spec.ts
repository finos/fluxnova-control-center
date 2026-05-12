import { describe, expect, it, vi } from 'vitest';
import { clearAll, getCache, withCache } from './cache';

describe('cache', () => {
  const cacheKey = 'userPermissions';

  it('should get a cache', () => {
    const cache = getCache(cacheKey);
    expect(cache).toBeTruthy();
  });

  it('should throw an error when asked to get an invalid cache', () => {
    let caughtError = false;
    const badCacheKey = 'fakeCache';
    try {
      getCache(badCacheKey as any);
    } catch (error: any) {
      caughtError = true;
      expect(error.message).toContain(badCacheKey);
    }
    expect(caughtError).toBeTruthy();
  });

  it('should ignore cache when passed empty/falsey key', async () => {
    const loadFn = vi.fn();
    loadFn.mockResolvedValue(null);
    const cache = getCache(cacheKey);
    let result = await withCache(cache, undefined as any, loadFn);
    expect(result).toEqual(null);
    result = await withCache(cache, undefined as any, loadFn);
    expect(result).toEqual(null);
    expect(loadFn).toHaveBeenCalledTimes(2);
    cache.flushAll();
  });

  it('should clear all caches', () => {
    const secretsCache = getCache('secrets');
    const flushAllSpy = vi.spyOn(secretsCache, 'flushAll');
    clearAll();
    expect(flushAllSpy).toHaveBeenCalled();
  });
});
