import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionCache } from './cache-utils';

describe('cache-utils', () => {
  let consoleWarnSpy: any;
  const storage = new Map<string, string>();

  const sessionStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
    key: vi.fn((index: number) => {
      const keys = Array.from(storage.keys());
      return keys[index] ?? null;
    }),
    get length() {
      return storage.size;
    },
  };

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });

  beforeEach(() => {
    sessionStorageMock.clear();

    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('basic storage and retrieval', () => {
    it('should set and get values', () => {
      const cache = createSessionCache();
      const testValue = { name: 'John', age: 30 };

      const success = cache.set('user', testValue);
      expect(success).toBe(true);

      const retrieved = cache.get<typeof testValue>('user');
      expect(retrieved).toEqual(testValue);
    });

    it('should return null for non-existent key', () => {
      const cache = createSessionCache();
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should update existing cache entry', () => {
      const cache = createSessionCache();

      cache.set('key', 'value1');
      expect(cache.get('key')).toBe('value1');

      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('TTL (time-to-live) expiration', () => {
    it('should expire entries after TTL', () => {
      const cache = createSessionCache({ ttlMs: 1000 });
      cache.set('temp', 'value');

      // Before expiration
      vi.advanceTimersByTime(999);
      expect(cache.get('temp')).toBe('value');

      // After expiration
      vi.advanceTimersByTime(2);
      expect(cache.get('temp')).toBeNull();
    });

    it('should remove expired entries from sessionStorage', () => {
      const cache = createSessionCache({ ttlMs: 1000, keyPrefix: 'test_' });
      cache.set('expired', 'value');

      expect(sessionStorage.getItem('test_expired')).not.toBeNull();

      vi.advanceTimersByTime(1001);
      cache.get('expired');

      expect(sessionStorage.getItem('test_expired')).toBeNull();
    });

    it('should reset timestamp when updating existing entry', () => {
      const cache = createSessionCache({ ttlMs: 5000 });

      cache.set('key', 'value1');
      vi.advanceTimersByTime(3000);

      // Update resets timestamp
      cache.set('key', 'value2');
      vi.advanceTimersByTime(3000);

      // Should still be valid (only 3s since update, not 6s)
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('cache key prefix', () => {
    it('should use custom prefix', () => {
      const cache = createSessionCache({ keyPrefix: 'myapp_' });
      cache.set('user', 'data');

      // Check that the key in sessionStorage has the custom prefix
      expect(sessionStorage.getItem('myapp_user')).not.toBeNull();
    });

    it('should use default prefix when not specified', () => {
      const cache = createSessionCache();
      cache.set('item', 'value');

      // Default prefix is 'cache_'
      expect(sessionStorage.getItem('cache_item')).not.toBeNull();
    });

    it('should isolate caches with different prefixes', () => {
      const cache1 = createSessionCache({ keyPrefix: 'app1_' });
      const cache2 = createSessionCache({ keyPrefix: 'app2_' });

      cache1.set('key', 'value1');
      cache2.set('key', 'value2');

      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });
  });

  describe('remove method', () => {
    it('should remove a cached item', () => {
      const cache = createSessionCache();
      cache.set('item', 'value');

      expect(cache.get('item')).toBe('value');

      cache.remove('item');
      expect(cache.get('item')).toBeNull();
    });

    it('should not throw error when removing non-existent key', () => {
      const cache = createSessionCache();
      expect(() => cache.remove('nonexistent')).not.toThrow();
    });

    it('should only remove item with correct prefix', () => {
      const cache = createSessionCache({ keyPrefix: 'test_' });

      // Manually add item with different prefix
      sessionStorage.setItem('other_item', 'value');

      cache.remove('item');

      // Item with different prefix should still exist
      expect(sessionStorage.getItem('other_item')).toBe('value');
    });
  });

  describe('clear method', () => {
    it('should clear all cache entries with the configured prefix', () => {
      const cache = createSessionCache({ keyPrefix: 'app_' });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should only clear items with matching prefix', () => {
      const cache1 = createSessionCache({ keyPrefix: 'app1_' });
      const cache2 = createSessionCache({ keyPrefix: 'app2_' });

      cache1.set('item', 'value1');
      cache2.set('item', 'value2');

      // Manually add item with different prefix
      sessionStorage.setItem('other_item', 'other_value');

      cache1.clear();

      expect(cache1.get('item')).toBeNull();
      expect(cache2.get('item')).toBe('value2');
      expect(sessionStorage.getItem('other_item')).toBe('other_value');
    });

    it('should handle empty cache', () => {
      const cache = createSessionCache();
      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON in sessionStorage', () => {
      const cache = createSessionCache({ keyPrefix: 'test_' });

      sessionStorage.setItem('test_invalid', 'invalid json {{{');

      const result = cache.get('invalid');
      expect(result).toBeNull();
      expect(sessionStorage.getItem('test_invalid')).toBeNull();
    });

    it('should handle sessionStorage quota exceeded', () => {
      const cache = createSessionCache();

      sessionStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const result = cache.set('key', 'value');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to cache value for key: key');
    });
  });

  describe('multiple cache instances', () => {
    it('should allow independent cache instances with different prefixes', () => {
      const userCache = createSessionCache({ keyPrefix: 'user_' });
      const dataCache = createSessionCache({ keyPrefix: 'data_' });

      userCache.set('profile', { name: 'Alice' });
      dataCache.set('records', [1, 2, 3]);

      expect(userCache.get('profile')).toEqual({ name: 'Alice' });
      expect(dataCache.get('records')).toEqual([1, 2, 3]);

      userCache.clear();

      expect(userCache.get('profile')).toBeNull();
      expect(dataCache.get('records')).toEqual([1, 2, 3]);
    });

    it('should share data between instances with same prefix', () => {
      const cache1 = createSessionCache({ keyPrefix: 'shared_' });
      cache1.set('data', { id: 1, name: 'Test' });

      const cache2 = createSessionCache({ keyPrefix: 'shared_' });

      expect(cache2.get('data')).toEqual({ id: 1, name: 'Test' });
    });
  });
});
