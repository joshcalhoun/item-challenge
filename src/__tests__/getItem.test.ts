import { describe, expect, it, beforeEach } from 'vitest';
import { getItemHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('getItemHandler', () => {
  beforeEach(resetStorage);

  it('should retrieve a created item', async () => {
    const item = await createTestItem();
    const result = await getItemHandler(item.id);
    expect(result.statusCode).toBe(200);
    expect(result.body).toHaveProperty('id', item.id);
  });
});
