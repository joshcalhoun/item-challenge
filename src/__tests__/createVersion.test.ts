import { describe, expect, it, beforeEach } from 'vitest';
import { createVersionHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('createVersionHandler', () => {
  beforeEach(resetStorage);
  it('should return 400 for invalid UUID', async () => {
    const result = await createVersionHandler('not-a-uuid');
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'INVALID_ID');
  });

  it('should return 404 for non-existent item', async () => {
    const result = await createVersionHandler('00000000-0000-0000-0000-000000000000');
    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty('error.code', 'ITEM_NOT_FOUND');
  });

  it('should create a new version', async () => {
    const item = await createTestItem();
    const result = await createVersionHandler(item.id);
    expect(result.statusCode).toBe(201);
    const body = result.body as { metadata: { version: number } };
    expect(body.metadata.version).toBe(2);
  });
});
