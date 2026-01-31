import { describe, expect, it, beforeEach } from 'vitest';
import { updateItemHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('updateItemHandler', () => {
  beforeEach(resetStorage);

  it('should update an existing item', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, { difficulty: 5 });
    expect(result.statusCode).toBe(200);
    const body = result.body as { difficulty: number; metadata: { version: number } };
    expect(body.difficulty).toBe(5);
    expect(body.metadata.version).toBe(2);
  });

});
