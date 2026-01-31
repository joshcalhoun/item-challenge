import { describe, expect, it, beforeEach } from 'vitest';
import { listItemsHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('listItemsHandler', () => {
  beforeEach(resetStorage);
  it('should return items list', async () => {
    await createTestItem();
    const result = await listItemsHandler({});
    expect(result.statusCode).toBe(200);
    const body = result.body as { items: unknown[]; total: number };
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
  });

  it('should filter by subject', async () => {
    await createTestItem({ subject: 'AP Calculus' });
    const result = await listItemsHandler({ subject: 'AP Calculus' });
    expect(result.statusCode).toBe(200);
    const body = result.body as { items: Array<{ subject: string }>; total: number };
    expect(body.items.every(i => i.subject === 'AP Calculus')).toBe(true);
  });

  it('should filter by status', async () => {
    const result = await listItemsHandler({ status: 'approved' });
    expect(result.statusCode).toBe(200);
  });

  it('should reject invalid query params', async () => {
    const result = await listItemsHandler({ limit: '-5' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should filter by combined subject and status', async () => {
    await createTestItem({ subject: 'AP Physics', metadata: { author: 'a', status: 'approved', tags: [] } });
    await createTestItem({ subject: 'AP Physics', metadata: { author: 'a', status: 'draft', tags: [] } });
    const result = await listItemsHandler({ subject: 'AP Physics', status: 'approved' });
    expect(result.statusCode).toBe(200);
    const body = result.body as { items: Array<{ subject: string; metadata: { status: string } }>; total: number };
    expect(body.items.every(i => i.subject === 'AP Physics' && i.metadata.status === 'approved')).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });
});
