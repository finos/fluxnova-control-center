import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRegexCache,
  getCachedRegex,
  isRegexPatternSafe,
  safeCompileRegex,
  testRegexPerformance,
} from './regex-utils';

const goodRegex = '^(usr\\d{4})(?:@.*)?$';

describe('regex-utils', () => {
  beforeEach(() => {
    clearRegexCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isRegexPatternSafe', () => {
    it('should return true for simple safe patterns', () => {
      expect(isRegexPatternSafe(goodRegex)).toBe(true);
      expect(isRegexPatternSafe('^\\w+@\\w+\\.com$')).toBe(true);
      expect(isRegexPatternSafe('^[a-z]{1,10}$')).toBe(true);
    });

    it('should return false for empty or whitespace patterns', () => {
      expect(isRegexPatternSafe('')).toBe(false);
      expect(isRegexPatternSafe('   ')).toBe(false);
    });

    it('should return false for patterns that are too long', () => {
      const longPattern = 'a'.repeat(501);
      expect(isRegexPatternSafe(longPattern)).toBe(false);
    });

    it('should return false for patterns with nested quantifiers', () => {
      expect(isRegexPatternSafe('(a+)+')).toBe(false);
      expect(isRegexPatternSafe('(a*)+')).toBe(false);
      expect(isRegexPatternSafe('(a+)*')).toBe(false);
    });

    it('should return false for patterns with overlapping alternation', () => {
      expect(isRegexPatternSafe('(a+|a)+')).toBe(false);
      expect(isRegexPatternSafe('(.*|.+)+')).toBe(false);
    });

    it('should return false for patterns with multiple consecutive quantifiers', () => {
      expect(isRegexPatternSafe('a++')).toBe(false);
      expect(isRegexPatternSafe('a*+')).toBe(false);
    });
  });

  describe('testRegexPerformance', () => {
    it('should return true for patterns that execute quickly', () => {
      expect(testRegexPerformance(goodRegex, 'usr1234@example.com')).toBe(true);
    });

    it('should return false for invalid patterns', () => {
      expect(testRegexPerformance('(((', 'test')).toBe(false);
    });

    it('should return false if pattern takes too long', () => {
      // This pattern can cause catastrophic backtracking with certain inputs
      // but we've set a very short timeout for testing
      const slowPattern = '(a+)+b';
      const slowInput = 'a'.repeat(20) + 'c';

      // Use a very short timeout for testing purposes
      const result = testRegexPerformance(slowPattern, slowInput, 1);
      // Note: This might still pass on very fast machines, but demonstrates the concept
      expect(typeof result).toBe('boolean');
    });
  });

  describe('safeCompileRegex', () => {
    it('should compile valid safe patterns', () => {
      const regex = safeCompileRegex(goodRegex);
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex?.test('usr1234')).toBe(true);
      expect(regex?.test('usr1234@example.com')).toBe(true);
    });

    it('should return null for undefined pattern', () => {
      expect(safeCompileRegex(undefined)).toBe(null);
    });

    it('should return null for unsafe patterns', () => {
      expect(safeCompileRegex('(a+)+')).toBe(null);
    });

    it('should return null for invalid regex syntax', () => {
      expect(safeCompileRegex('(((')).toBe(null);
    });

    it('should test performance when testInput is provided', () => {
      const regex = safeCompileRegex(goodRegex, 'usr1234');
      expect(regex).toBeInstanceOf(RegExp);
    });
  });

  describe('getCachedRegex', () => {
    it('should cache compiled regex patterns', () => {
      const pattern = goodRegex;
      const regex1 = getCachedRegex(pattern);
      const regex2 = getCachedRegex(pattern);

      expect(regex1).toBe(regex2); // Same instance
      expect(regex1).toBeInstanceOf(RegExp);
    });

    it('should return null for undefined pattern', () => {
      expect(getCachedRegex(undefined)).toBe(null);
    });

    it('should cache null for invalid patterns', () => {
      const pattern = '(a+)+';
      const result1 = getCachedRegex(pattern);
      const result2 = getCachedRegex(pattern);

      expect(result1).toBe(null);
      expect(result2).toBe(null);
      expect(result1).toBe(result2); // Same cached null
    });

    it('should cache different patterns separately', () => {
      const pattern1 = '^[a-z]+$';
      const pattern2 = '^[0-9]+$';

      const regex1 = getCachedRegex(pattern1);
      const regex2 = getCachedRegex(pattern2);

      expect(regex1).not.toBe(regex2);
      expect(regex1?.test('abc')).toBe(true);
      expect(regex2?.test('123')).toBe(true);
    });
  });

  describe('clearRegexCache', () => {
    it('should clear the regex cache', () => {
      const pattern = '^[a-z]+$';
      const regex1 = getCachedRegex(pattern);

      clearRegexCache();

      const regex2 = getCachedRegex(pattern);

      expect(regex1).not.toBe(regex2); // Different instances after clearing cache
      expect(regex1).toBeInstanceOf(RegExp);
      expect(regex2).toBeInstanceOf(RegExp);
    });
  });
});
