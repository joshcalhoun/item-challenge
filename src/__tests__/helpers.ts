import { expect } from 'vitest';
import { createItemHandler } from '../handlers/index.js';
import { storage } from '../handlers/storage.js';

export const validItem = {
  subject: 'AP Biology',
  itemType: 'multiple-choice' as const,
  difficulty: 3,
  content: {
    question: 'What is photosynthesis?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: 'Photosynthesis is the process...',
  },
  metadata: {
    author: 'test-author',
    status: 'draft' as const,
    tags: ['biology'],
  },
  securityLevel: 'standard' as const,
};

export function resetStorage() {
  if (storage.reset) {
    storage.reset();
  }
}

export async function createTestItem(overrides = {}) {
  const result = await createItemHandler({ ...validItem, ...overrides });
  expect(result.statusCode).toBe(201);
  return result.body as unknown as { id: string; [key: string]: unknown };
}
