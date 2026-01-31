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

  it('should allow free-response without options', async () => {
    const result = await createItemHandler({
      ...validItem,
      itemType: 'free-response',
      content: { question: 'Q?', correctAnswer: 'A', explanation: 'E' },
    });
    expect(result.statusCode).toBe(201);
  });

});
