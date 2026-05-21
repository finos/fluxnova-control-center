/**
 * Represents a cached value with a timestamp for TTL validation.
 */
export interface CachedValue<T> {
  value: T;
  timestamp: number;
}

/**
 * Configuration options for session storage cache.
 */
export interface CacheConfig {
  /** Time-to-live in milliseconds. Default: 24 hours */
  ttlMs?: number;
  /** Prefix for cache keys. Default: 'cache_' */
  keyPrefix?: string;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_KEY_PREFIX = 'cache_';

/**
 * Creates a session storage cache instance with TTL support.
 * Cache is automatically cleared when the browser session ends.
 *
 * @param config - Cache configuration options
 * @returns Cache instance with get, set, remove, and clear methods
 *
 * @example
 * ```typescript
 * const cache = createSessionCache({ ttlMs: 3600000 }); // 1 hour TTL
 *
 * // Set a value
 * cache.set('user_123', { name: 'John', role: 'admin' });
 *
 * // Get a value (returns null if expired or not found)
 * const user = cache.get<UserData>('user_123');
 *
 * // Remove a value
 * cache.remove('user_123');
 *
 * // Clear all cache entries with this prefix
 * cache.clear();
 * ```
 */
export function createSessionCache(config: CacheConfig = {}) {
  const ttlMs = config.ttlMs ?? DEFAULT_TTL_MS;
  const keyPrefix = config.keyPrefix ?? DEFAULT_KEY_PREFIX;

  /**
   * Gets the full cache key with prefix.
   */
  function getCacheKey(key: string): string {
    return `${keyPrefix}${key}`;
  }

  /**
   * Retrieves a cached value if it exists and hasn't expired.
   * @param key - The cache key
   * @returns The cached value or null if not found or expired
   */
  function get<T>(key: string): T | null {
    const cacheKey = getCacheKey(key);
    const cached = sessionStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    try {
      const cachedData: CachedValue<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache entry has expired
      if (now - cachedData.timestamp > ttlMs) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return cachedData.value;
    } catch {
      // If there's an error parsing, remove the invalid cache entry
      sessionStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Stores a value in the cache with the current timestamp.
   * @param key - The cache key
   * @param value - The value to cache
   * @returns true if successful, false if storage quota exceeded
   */
  function set<T>(key: string, value: T): boolean {
    const cacheKey = getCacheKey(key);
    const cacheData: CachedValue<T> = {
      value,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch {
      // Handle potential sessionStorage quota exceeded errors
      console.warn(`Failed to cache value for key: ${key}`);
      return false;
    }
  }

  /**
   * Removes a specific item from the cache.
   * @param key - The cache key to remove
   */
  function remove(key: string): void {
    const cacheKey = getCacheKey(key);
    sessionStorage.removeItem(cacheKey);
  }

  /**
   * Clears all cache entries with the configured prefix.
   */
  function clear(): void {
    const keysToRemove: string[] = [];

    // Find all keys with the cache prefix
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    // Remove all matching keys
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }

  return {
    get,
    set,
    remove,
    clear,
  };
}
