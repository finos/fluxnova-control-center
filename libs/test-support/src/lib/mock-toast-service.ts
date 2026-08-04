import { vi } from 'vitest';

export const toastServiceSpy = {
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
};
