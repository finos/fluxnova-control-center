import { decode } from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { getTimeUntilTokenExpiration } from './get-time-until-token-expiration';

vi.mock('jsonwebtoken');
const mockDecode = vi.mocked(decode);

describe('getTimeUntilTokenExpiration', () => {
  it('should return positive time when exp is in future', () => {
    const token = 'fakeToken';
    const exp = Math.floor(Date.now() / 1000) + 60;
    mockDecode.mockReturnValueOnce({ exp });

    const result = getTimeUntilTokenExpiration(token);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(exp * 1000);
  });

  it('should return negative time when exp is in past', () => {
    const token = 'fakeToken';
    const exp = Math.floor(Date.now() / 1000) - 60;
    mockDecode.mockReturnValueOnce({ exp });

    const result = getTimeUntilTokenExpiration(token);

    expect(result).toBeLessThan(0);
  });

  it('should return 0 when there is an error', () => {
    const token = 'fakeToken';
    mockDecode.mockImplementationOnce(() => {
      throw new Error();
    });

    const result = getTimeUntilTokenExpiration(token);

    expect(result).toBe(0);
  });
});
