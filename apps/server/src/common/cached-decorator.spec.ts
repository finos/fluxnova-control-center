import { Dictionary } from '@fxn/types';
import NodeCache from 'node-cache';
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { getCache, withCache } from './cache';
import { Cached } from './cached-decorator';

const mockDataGetter = vi.fn();
vi.mock('./cache');

class SampleClass {
  @Cached('userPermissions')
  async sampleMethod(id: string) {
    return mockDataGetter(id);
  }
}

describe('cached-decorator', () => {
  let cache: Dictionary<string>;
  let sampleClass: SampleClass;
  const mockWithCache = withCache as MockedFunction<typeof withCache>;
  const mockGetCache = getCache as MockedFunction<typeof getCache>;

  beforeEach(() => {
    cache = {};
    sampleClass = new SampleClass();
    mockGetCache.mockReturnValue(cache as unknown as NodeCache);
    mockDataGetter.mockImplementation((id) => id);
    mockWithCache.mockImplementation(async (c, id, caller) => {
      if (!cache[id]) {
        cache[id] = (await caller(id)) as string;
      }
      return Promise.resolve(cache[id]);
    });
  });
  it('should cache decorated function', async () => {
    const res1 = await sampleClass.sampleMethod('1');
    const res2 = await sampleClass.sampleMethod('2');
    const res3 = await sampleClass.sampleMethod('1');
    expect(res1).toEqual('1');
    expect(res2).toEqual('2');
    expect(res3).toEqual('1');
    expect(mockDataGetter).toHaveBeenCalledTimes(2);
    expect(mockDataGetter).toHaveBeenCalledWith('1');
    expect(mockDataGetter).toHaveBeenCalledWith('2');
    expect(mockWithCache).toHaveBeenCalledTimes(3);
  });
});
