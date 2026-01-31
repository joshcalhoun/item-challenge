import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { ExamItem, CreateItemRequest, UpdateItemRequest, ListItemsQuery, ListItemsResult } from '../types/item.js';
import { ItemStorage } from './interface.js';

export class DynamoDBStorage implements ItemStorage {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }),
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'ExamItems';
  }

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

    // Write CURRENT record
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${item.id}`, SK: 'CURRENT', ...item },
    }));

    // Write VERSION#1 snapshot
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${item.id}`, SK: 'VERSION#000001', ...item },
    }));

    return item;
  }

  async getItem(id: string): Promise<ExamItem | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `ITEM#${id}`, SK: 'CURRENT' },
    }));

    if (!result.Item) return null;
    const { PK, SK, ...item } = result.Item as Record<string, unknown>;
    return item as unknown as ExamItem;
  }

  async updateItem(id: string, data: UpdateItemRequest): Promise<ExamItem | null> {
    const existing = await this.getItem(id);
    if (!existing) return null;

    const updated: ExamItem = {
      ...existing,
      ...data,
      content: data.content ? { ...existing.content, ...data.content } : existing.content,
      metadata: {
        ...existing.metadata,
        ...(data.metadata || {}),
        lastModified: Date.now(),
        version: existing.metadata.version + 1,
      },
    };

    // Update CURRENT
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${id}`, SK: 'CURRENT', ...updated },
    }));

    // Write version snapshot
    const versionKey = String(updated.metadata.version).padStart(6, '0');
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${id}`, SK: `VERSION#${versionKey}`, ...updated },
    }));

    return updated;
  }

  async listItems(query: ListItemsQuery): Promise<ListItemsResult> {
    const limit = query.limit || 10;

    // The cursor is a base64url-encoded JSON representation of DynamoDB's LastEvaluatedKey.
    // base64url keeps the composite key object opaque and URL-safe for use as a query parameter.
    const exclusiveStartKey = query.cursor
      ? JSON.parse(Buffer.from(query.cursor, 'base64url').toString())
      : undefined;

    const statusFilter = query.status
      ? {
          FilterExpression: 'metadata.#st = :status',
          ExpressionAttributeNames: { '#st': 'status' },
        }
      : undefined;

    const commandInput = query.subject
      ? {
          TableName: this.tableName,
          IndexName: 'SubjectStatusIndex',
          KeyConditionExpression: 'subject = :subject AND SK = :sk',
          ExpressionAttributeValues: {
            ':subject': query.subject,
            ':sk': 'CURRENT',
            ...(query.status && { ':status': query.status }),
          },
          ...statusFilter,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
        }
      : {
          TableName: this.tableName,
          IndexName: 'EntityTypeIndex',
          KeyConditionExpression: 'SK = :sk',
          ExpressionAttributeValues: {
            ':sk': 'CURRENT',
            ...(query.status && { ':status': query.status }),
          },
          ...statusFilter,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
        };

    const result = await this.client.send(new QueryCommand(commandInput));

    const items = (result.Items || []).map(({ PK, SK, ...item }) => item) as ExamItem[];
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
      : undefined;

    return { items, cursor: nextCursor };
  }

  async createVersion(id: string): Promise<ExamItem | null> {
    const existing = await this.getItem(id);
    if (!existing) return null;

    const newVersion: ExamItem = {
      ...existing,
      metadata: {
        ...existing.metadata,
        version: existing.metadata.version + 1,
        lastModified: Date.now(),
      },
    };

    // Update CURRENT
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${id}`, SK: 'CURRENT', ...newVersion },
    }));

    // Write version snapshot
    const versionKey = String(newVersion.metadata.version).padStart(6, '0');
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `ITEM#${id}`, SK: `VERSION#${versionKey}`, ...newVersion },
    }));

    return newVersion;
  }

  async getAuditTrail(id: string): Promise<ExamItem[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `ITEM#${id}`,
        ':prefix': 'VERSION#',
      },
    }));

    return (result.Items || []).map(({ PK, SK, ...item }) => item) as ExamItem[];
  }
}
