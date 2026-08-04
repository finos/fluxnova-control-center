import { MockInstance } from 'vitest';

export const getMockCallArgumentReference = <T>(mockInstance: MockInstance<T>) => mockInstance.mock.calls[0][0];
