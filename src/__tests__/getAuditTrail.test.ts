import { describe, expect, it, beforeEach } from 'vitest';
import { createVersionHandler, getAuditTrailHandler } from '../handlers/index.js';
import { createTestItem, resetStorage } from './helpers.js';

describe('getAuditTrailHandler', () => {
  beforeEach(resetStorage);
  it('should return 400 for invalid UUID', async () => {
    const result = await getAuditTrailHandler('not-a-uuid');
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'INVALID_ID');
  });

  it('should return 404 for non-existent item', async () => {
    const result = await getAuditTrailHandler('00000000-0000-0000-0000-000000000000');
    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty('error.code', 'AUDIT_TRAIL_NOT_FOUND');
  });

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
