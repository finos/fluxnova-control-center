import { MockInstance, vi } from 'vitest';

export function mockConsoleWarn(): MockInstance {
  return vi.spyOn(console, 'warn').mockImplementation(vi.fn());
}

// should only be used when testing error states - we don't want to suppress real errors
export function mockConsoleError(): MockInstance {
  return vi.spyOn(console, 'error').mockImplementation(vi.fn());
}
