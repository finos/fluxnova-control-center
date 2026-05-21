import { ConfigService } from '@nestjs/config';
import { Mocked, vi } from 'vitest';

export function getMockConfigService(): Mocked<ConfigService> {
  return {
    get: vi.fn(
      (key: string, defaultValue?: any) =>
        // eslint-disable-next-line n/no-process-env
        process.env[key] ?? defaultValue,
    ),
    set: vi.fn((key: string, value: any) => {
      if (value === undefined) {
        // NOTE: The actual implementation doesn't handle `undefined` values this way, but we need to do this here
        // so we can delete variables to test particular circumstances that are necessary in a testing context but
        // not likely to occur in normal operation.

        // eslint-disable-next-line n/no-process-env
        delete process.env[key];
        return;
      }

      // eslint-disable-next-line n/no-process-env
      process.env[key] = String(value);
    }),
  } as unknown as Mocked<ConfigService>;
}
