import { describe, expect, it, beforeEach } from 'vitest';
import { createVersionHandler, getAuditTrailHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('getAuditTrailHandler', () => {
  beforeEach(resetStorage);
  it('should return audit trail after versioning', async () => {
    const item = await createTestItem();
    await createVersionHandler(item.id);
    const result = await getAuditTrailHandler(item.id);
    expect(result.statusCode).toBe(200);
    const body = result.body as { itemId: string; versions: unknown[]; total: number };
    expect(body.itemId).toBe(item.id);
    expect(body.total).toBe(2);
    expect(body.versions).toHaveLength(2);
  });
});
