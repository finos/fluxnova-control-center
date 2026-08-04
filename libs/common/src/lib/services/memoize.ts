import { shareReplay } from 'rxjs/operators';

const CACHE_TIMEOUT = 10000;

export const memoize = (fn: any, cacheTimeout: number = CACHE_TIMEOUT) => {
  let cache: { [key: string]: any } = {};
  let cacheCreationDate = new Date().getTime();

  return (...args: any[]) => {
    const ageOfCacheInMilliseconds = new Date().getTime() - cacheCreationDate;
    const cacheKey: string = JSON.stringify(args);

    if (ageOfCacheInMilliseconds > cacheTimeout) {
      cache = {};
      cacheCreationDate = new Date().getTime();
    }

    if (typeof cache[cacheKey] === 'undefined') {
      cache[cacheKey] = fn(...args).pipe(shareReplay());
    }

    return cache[cacheKey];
  };
};
