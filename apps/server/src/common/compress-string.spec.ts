import { repeat } from 'lodash-es';
import { compressString, decompressString } from './compress-string';

describe('compress-string.ts', () => {
  it('should compress strings with length greater than or equal to MIN_COMPRESS', async () => {
    const longStr = createStr(2048);
    const compressed = await compressString(longStr);
    expect(compressed.length).toBeLessThan(longStr.length);
  });

  it('should compress strings with length less than MIN_COMPRESS', async () => {
    const longStr = createStr(2047);
    const compressed = await compressString(longStr);
    expect(longStr).toEqual(compressed);
  });

  it('compressString should return the input if empty', async () => {
    expect(await compressString('')).toBe('');
    expect(await compressString(undefined as unknown as string)).toBe(undefined);
    expect(await compressString(null as unknown as string)).toBe(null);
  });

  it('decompressString should return the input if empty', async () => {
    expect(await decompressString('')).toBe('');
    expect(await decompressString(undefined as unknown as string)).toBe(undefined);
    expect(await decompressString(null as unknown as string)).toBe(null);
  });

  it('should compress and decompress', async () => {
    const longStr = createStr(2048);
    const compressed = await compressString(longStr);
    const decompressed = await decompressString(compressed);
    expect(decompressed).toEqual(longStr);
  });

  it('should compress and decompress (too small to compress)', async () => {
    const longStr = createStr(2047);
    const compressed = await compressString(longStr);
    const decompressed = await decompressString(compressed);
    expect(decompressed).toEqual(longStr);
    expect(compressed).toEqual(longStr);
  });

  function createStr(len: number) {
    return repeat('a', len);
  }
});
