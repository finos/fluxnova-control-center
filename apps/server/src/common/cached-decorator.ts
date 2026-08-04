import { cacheKeys, getCache, withCache } from './index';

/**
 * Decorator to enable cache on a method. Expects a method that takes a single string (the cache items key/identifier).
 */
export function Cached(cacheName: cacheKeys) {
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    const cache = getCache(cacheName);
    const original = descriptor.value;
    descriptor.value = function (id: string) {
      return withCache(cache, id, (i) => original.call(this, i));
    };
  };
}
