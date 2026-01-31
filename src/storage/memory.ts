/**
 * In-Memory Storage Implementation
 *
 * This is a simple in-memory storage for local development and testing.
 * Data is lost when the server restarts.
 */

import { randomUUID } from 'crypto';
import { ExamItem, CreateItemRequest, UpdateItemRequest, ListItemsQuery, ListItemsResult } from '../types/item.js';
import { ItemStorage } from './interface.js';

export class MemoryStorage implements ItemStorage {
  private items: Map<string, ExamItem> = new Map();
  private versions: Map<string, ExamItem[]> = new Map();

  async createItem(data: CreateItemRequest): Promise<ExamItem> {
    const now = Date.now();
    const item: ExamItem = {
      id: randomUUID(),
      ...data,
      metadata: {
        ...data.metadata,
        created: now,
        lastModified: now,
        version: 1,
      },
    };

    this.items.set(item.id, item);
    this.versions.set(item.id, [{ ...item }]);

    return item;
  }

  async getItem(id: string): Promise<ExamItem | null> {
    return this.items.get(id) || null;
  }

  async updateItem(id: string, data: UpdateItemRequest): Promise<ExamItem | null> {
    const item = this.items.get(id);
    if (!item) return null;

    const updated: ExamItem = {
      ...item,
      ...data,
      content: data.content ? { ...item.content, ...data.content } : item.content,
      metadata: {
        ...item.metadata,
        ...(data.metadata || {}),
        lastModified: Date.now(),
        version: item.metadata.version + 1,
      },
    };

    this.items.set(id, updated);

    // Save version history
    const history = this.versions.get(id) || [];
    history.push({ ...updated });
    this.versions.set(id, history);

    return updated;
  }

  async listItems(query: ListItemsQuery): Promise<ListItemsResult> {
    let items = Array.from(this.items.values());

    // Filter by subject
    if (query.subject) {
      items = items.filter(item => item.subject === query.subject);
    }

    // Filter by status
    if (query.status) {
      items = items.filter(item => item.metadata.status === query.status);
    }

    // Cursor-based pagination (cursor is the item ID to start after)
    const limit = query.limit || 10;
    let startIndex = 0;

    if (query.cursor) {
      const cursorId = Buffer.from(query.cursor, 'base64url').toString();
      const cursorIndex = items.findIndex(item => item.id === cursorId);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const page = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const nextCursor = hasMore
      ? Buffer.from(page[page.length - 1].id).toString('base64url')
      : undefined;

    return { items: page, cursor: nextCursor };
  }

  async createVersion(id: string): Promise<ExamItem | null> {
    const item = this.items.get(id);
    if (!item) return null;

    // Create a new version (copy of current state)
    const newVersion: ExamItem = {
      ...item,
      metadata: {
        ...item.metadata,
        version: item.metadata.version + 1,
        lastModified: Date.now(),
      },
    };

    this.items.set(id, newVersion);

    const history = this.versions.get(id) || [];
    history.push({ ...newVersion });
    this.versions.set(id, history);

    return newVersion;
  }

  async getAuditTrail(id: string): Promise<ExamItem[]> {
    return this.versions.get(id) || [];
  }

  reset(): void {
    this.items.clear();
    this.versions.clear();
  }
}
