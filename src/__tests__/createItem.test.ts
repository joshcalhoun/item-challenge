import { describe, expect, it, beforeEach } from 'vitest';
import { createItemHandler } from '../handlers/index.js';
import { validItem, resetStorage } from './helpers.js';

describe('createItemHandler', () => {
  beforeEach(resetStorage);
  it('should create a valid item', async () => {
    const result = await createItemHandler(validItem);
    expect(result.statusCode).toBe(201);
    expect(result.body).toHaveProperty('id');
  });

  it('should reject null body', async () => {
    const result = await createItemHandler(null);
    expect(result.statusCode).toBe(400);
  });

  it('should reject undefined body', async () => {
    const result = await createItemHandler(undefined);
    expect(result.statusCode).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const result = await createItemHandler({ subject: 'AP Biology' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
    expect(result.body).toHaveProperty('error.details');
  });

  it('should reject invalid difficulty', async () => {
    const result = await createItemHandler({ ...validItem, difficulty: 10 });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject invalid itemType', async () => {
    const result = await createItemHandler({ ...validItem, itemType: 'invalid' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject invalid securityLevel', async () => {
    const result = await createItemHandler({ ...validItem, securityLevel: 'invalid' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject invalid status', async () => {
    const result = await createItemHandler({
      ...validItem,
      metadata: { ...validItem.metadata, status: 'invalid' },
    });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject multiple-choice without options', async () => {
    const noOptions = {
      ...validItem,
      content: { question: 'Q?', correctAnswer: 'A', explanation: 'E' },
    };
    const result = await createItemHandler(noOptions);
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should allow free-response without options', async () => {
    const result = await createItemHandler({
      ...validItem,
      itemType: 'free-response',
      content: { question: 'Q?', correctAnswer: 'A', explanation: 'E' },
    });
    expect(result.statusCode).toBe(201);
  });

  it('should reject difficulty of 0 (below minimum)', async () => {
    const result = await createItemHandler({ ...validItem, difficulty: 0 });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject difficulty of 6 (above maximum)', async () => {
    const result = await createItemHandler({ ...validItem, difficulty: 6 });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('should reject empty string subject', async () => {
    const result = await createItemHandler({ ...validItem, subject: '' });
    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });
});
