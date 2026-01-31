import { describe, expect, it, beforeEach } from 'vitest';
import { getItemHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('getItemHandler', () => {
  beforeEach(resetStorage);
  it('should return 400 for invalid UUID', async () => {
    const result = await getItemHandler('not-a-uuid');
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'INVALID_ID');
  });

  it('should return 404 for non-existent item', async () => {
    const result = await getItemHandler('00000000-0000-0000-0000-000000000000');
    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty('error.code', 'ITEM_NOT_FOUND');
  });

  it('should retrieve a created item', async () => {
    const item = await createTestItem();
    const result = await getItemHandler(item.id);
    expect(result.statusCode).toBe(200);
    expect(result.body).toHaveProperty('id', item.id);
  });
});
