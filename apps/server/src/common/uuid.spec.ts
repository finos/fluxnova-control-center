import { generateUuidV4 } from './uuid';

describe('uuid', () => {
  it('should generate a valid UUID v4', () => {
    expect(generateUuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
