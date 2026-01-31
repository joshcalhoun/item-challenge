import { describe, expect, it, beforeEach } from 'vitest';
import { updateItemHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('updateItemHandler', () => {
  beforeEach(resetStorage);
  it('should return 400 for invalid UUID', async () => {
    const result = await updateItemHandler('not-a-uuid', { difficulty: 5 });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'INVALID_ID');
  });

  it('should return 404 for non-existent item', async () => {
    const result = await updateItemHandler('00000000-0000-0000-0000-000000000000', { difficulty: 5 });
    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty('error.code', 'ITEM_NOT_FOUND');
  });

  it('should update an existing item', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, { difficulty: 5 });
    expect(result.statusCode).toBe(200);
    const body = result.body as { difficulty: number; metadata: { version: number } };
    expect(body.difficulty).toBe(5);
    expect(body.metadata.version).toBe(2);
  });

  it('should reject invalid update data', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, { difficulty: 99 });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject metadata.version in update body (strict mode)', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, {
      metadata: { version: 999 },
    });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject metadata.created in update body (strict mode)', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, {
      metadata: { created: 0 },
    });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject metadata.lastModified in update body (strict mode)', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, {
      metadata: { lastModified: 0 },
    });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should strip or reject unknown fields in update', async () => {
    const item = await createTestItem();
    const result = await updateItemHandler(item.id, {
      difficulty: 4,
      unknownField: 'should-not-exist',
    } as any);
    // Either rejected (400) or accepted with unknown field stripped (200 without field)
    if (result.statusCode === 200) {
      expect(result.body).not.toHaveProperty('unknownField');
    } else {
      expect(result.statusCode).toBe(400);
    }
  });
});
