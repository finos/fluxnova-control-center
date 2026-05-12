import { Logger } from '@nestjs/common';

const logger = new Logger('regex-utils');

/**
 * Validates a regex pattern to prevent ReDoS (Regular Expression Denial of Service) attacks.
 * Checks for common patterns that can cause catastrophic backtracking.
 *
 * @param pattern - The regex pattern to validate
 * @returns true if the pattern is considered safe, false otherwise
 */
export function isRegexPatternSafe(pattern: string): boolean {
  // Check for empty pattern
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }

  // Check for excessive length that could indicate a complex pattern
  if (pattern.length > 500) {
    logger.warn(`Regex pattern exceeds safe length limit (500 characters): ${pattern.substring(0, 100)}...`);
    return false;
  }

  // Check for nested quantifiers that can cause catastrophic backtracking
  // Patterns like (a+)+, (a*)+, (a+)*, etc.
  const nestedQuantifierPattern = /\([^)]*[*+][^)]*\)[*+{]/;
  if (nestedQuantifierPattern.test(pattern)) {
    logger.warn('Regex pattern contains nested quantifiers that may cause ReDoS');
    return false;
  }

  // Check for alternation with overlapping patterns
  // Patterns like (a+|a)+ or (.*|.+)+
  const overlappingAlternationPattern = /\([^)]*\|[^)]*\)[*+{]/;
  if (overlappingAlternationPattern.test(pattern)) {
    logger.warn('Regex pattern contains alternation with quantifiers that may cause ReDoS');
    return false;
  }

  // Check for excessive backtracking potential with multiple consecutive quantifiers
  const consecutiveQuantifiersPattern = /[*+]{2,}|[*+].*[*+].*[*+]/;
  if (consecutiveQuantifiersPattern.test(pattern)) {
    logger.warn('Regex pattern contains multiple quantifiers that may cause performance issues');
    return false;
  }

  return true;
}

/**
 * Tests a regex pattern against a sample input to ensure it completes in a reasonable time.
 *
 * @param pattern - The regex pattern to test
 * @param testInput - A sample input to test the pattern against
 * @param timeoutMs - Maximum time allowed for the test in milliseconds (default: 100ms)
 * @returns true if the pattern completes within the timeout, false otherwise
 */
export function testRegexPerformance(pattern: string, testInput: string, timeoutMs = 100): boolean {
  const startTime = Date.now();

  try {
    const regex = new RegExp(pattern);
    regex.test(testInput);

    const duration = Date.now() - startTime;
    if (duration > timeoutMs) {
      logger.warn(`Regex pattern took ${duration}ms to execute (limit: ${timeoutMs}ms)`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Error testing regex pattern: ${error}`);
    return false;
  }
}

/**
 * Safely compiles and validates a regex pattern from an environment variable.
 * The compiled regex is cached for performance.
 *
 * @param pattern - The regex pattern string
 * @param testInput - Optional sample input to test the pattern against
 * @returns The compiled RegExp object or null if the pattern is invalid/unsafe
 */
export function safeCompileRegex(pattern: string | undefined, testInput?: string): RegExp | null {
  if (!pattern) {
    return null;
  }

  // Validate pattern safety
  if (!isRegexPatternSafe(pattern)) {
    logger.error(`Regex pattern failed safety validation: ${pattern}`);
    return null;
  }

  try {
    const regex = new RegExp(pattern);

    // Test performance if a test input is provided
    if (testInput && !testRegexPerformance(pattern, testInput)) {
      logger.error(`Regex pattern failed performance test: ${pattern}`);
      return null;
    }

    return regex;
  } catch (error: any) {
    logger.error(`Failed to compile regex pattern: ${pattern}`, error.message);
    return null;
  }
}

/**
 * Cache for compiled regex patterns to avoid recompilation on every request.
 */
const regexCache = new Map<string, RegExp | null>();

/**
 * Gets or compiles a cached regex pattern.
 * This is useful for patterns from environment variables that don't change during runtime.
 *
 * @param pattern - The regex pattern string
 * @param testInput - Optional sample input to test the pattern against
 * @returns The compiled RegExp object or null if the pattern is invalid/unsafe
 */
export function getCachedRegex(pattern: string | undefined, testInput?: string): RegExp | null {
  if (!pattern) {
    return null;
  }

  if (!regexCache.has(pattern)) {
    const compiledRegex = safeCompileRegex(pattern, testInput);
    regexCache.set(pattern, compiledRegex);
  }

  return regexCache.get(pattern) ?? null;
}

/**
 * Clears the regex cache. Useful for testing purposes.
 */
export function clearRegexCache(): void {
  regexCache.clear();
}
