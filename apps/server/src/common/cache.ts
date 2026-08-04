import { isEmpty } from 'lodash-es';
import NodeCache from 'node-cache';
import { Logger } from '@nestjs/common';

const ONE_MINUTE = 60;
const THIRTY_MINUTES = ONE_MINUTE * 30;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const logger = new Logger('Cache');

// useClones: false use relates to https://github.com/node-cache/node-cache/issues/127
const caches = {
  secrets: new NodeCache({
    stdTTL: ONE_MINUTE * 10, // 10 minutes
    checkperiod: ONE_MINUTE * 10, // 10 minutes
    useClones: false,
  }),
  userPermissions: new NodeCache({ stdTTL: THIRTY_MINUTES, useClones: false }),
  oauthTokens: new NodeCache({ stdTTL: ONE_MINUTE * 10, useClones: false }),
  processDefinitions: new NodeCache({ stdTTL: ONE_DAY, useClones: false }), // process definitions cache for process instance list perf
  'proxy-tenant-map': new NodeCache({ stdTTL: ONE_HOUR, useClones: false }),
  processDefinitionHistory: new NodeCache({ stdTTL: ONE_HOUR, useClones: false }), // 1 hour cache for large history results
};

export type cacheKeys = keyof typeof caches;

export function clearAll() {
  Object.values(caches).forEach((cache) => cache.flushAll());
  logger.log('cache cleared');
}

export async function withCache<T>(
  cache: NodeCache,
  key: string,
  loadFn: (key: string) => Promise<T>,
  ttl?: number,
): Promise<T> {
  if (isEmpty(key)) {
    return loadFn(key);
  }

  const cachedValue = cache.get<T>(key);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const result = await loadFn(key);
  if (result !== undefined) {
    cache.set(key, result, ttl as string | number);
  }
  return result;
}

export function getCache(cacheKey: cacheKeys): NodeCache {
  const cache = caches[cacheKey];
  if (!cache) {
    throw new Error(`no cache for cacheKey ${cacheKey}`);
  }
  return cache;
}
