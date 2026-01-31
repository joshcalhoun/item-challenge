import { CreateItemRequest } from '../types/item.js';
import { CreateItemSchema } from '../validation/schemas.js';
import { storage } from './storage.js';

export async function createItemHandler(data: unknown) {
    try {

        const parsed = CreateItemSchema.safeParse(data);
        if (!parsed.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid item data', details: parsed.error.errors },
            };
        }

        const newItem = await storage.createItem(data as CreateItemRequest);

        return {
            statusCode: 201,
            body: newItem,
        };
    } catch (error) {
        console.error('Error creating item:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}