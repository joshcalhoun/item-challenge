import { describe, expect, it, beforeEach } from 'vitest';
import { listItemsHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('listItemsHandler', () => {
  beforeEach(resetStorage);
  it('should return items list', async () => {
    await createTestItem();
    const result = await listItemsHandler({});
    expect(result.statusCode).toBe(200);
    const body = result.body as { items: unknown[]; cursor?: string };
    expect(body).toHaveProperty('items');
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by subject', async () => {
    await createTestItem({ subject: 'AP Calculus' });
    const result = await listItemsHandler({ subject: 'AP Calculus' });
    expect(result.statusCode).toBe(200);
    const body = result.body as unknown as{ items: Array<{ subject: string }>; total: number };
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

  it('should return 400 for malformed cursor', async () => {
    const result = await listItemsHandler({ cursor: 'not-valid-base64' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'INVALID_CURSOR');
  });

  it('should paginate with cursor round-trip', async () => {
    await createTestItem({ subject: 'Page1' });
    await createTestItem({ subject: 'Page2' });
    await createTestItem({ subject: 'Page3' });

    const firstPage = await listItemsHandler({ limit: '1' });
    expect(firstPage.statusCode).toBe(200);
    const firstBody = firstPage.body as { items: Array<{ id: string }>; cursor?: string };
    expect(firstBody.items).toHaveLength(1);
    expect(firstBody.cursor).toBeDefined();

    const secondPage = await listItemsHandler({ limit: '1', cursor: firstBody.cursor });
    expect(secondPage.statusCode).toBe(200);
    const secondBody = secondPage.body as { items: Array<{ id: string }>; cursor?: string };
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.items[0].id).not.toBe(firstBody.items[0].id);
  });

  it('should filter by combined subject and status', async () => {
    await createTestItem({ subject: 'AP Physics', metadata: { author: 'a', status: 'approved', tags: [] } });
    await createTestItem({ subject: 'AP Physics', metadata: { author: 'a', status: 'draft', tags: [] } });
    const result = await listItemsHandler({ subject: 'AP Physics', status: 'approved' });
    expect(result.statusCode).toBe(200);
    const body = result.body as { items: Array<{ subject: string; metadata: { status: string } }>; cursor?: string };
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.items.every(i => i.subject === 'AP Physics' && i.metadata.status === 'approved')).toBe(true);
  });
});
