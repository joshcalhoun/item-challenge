import { describe, expect, it, beforeEach } from 'vitest';
import { createVersionHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('createVersionHandler', () => {
  beforeEach(resetStorage);
  it('should create a new version', async () => {
    const item = await createTestItem();
    const result = await createVersionHandler(item.id);
    expect(result.statusCode).toBe(201);
    const body = result.body as { metadata: { version: number } };
    expect(body.metadata.version).toBe(2);
  });
});
