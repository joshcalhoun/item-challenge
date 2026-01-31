import { CreateItemRequest } from '../types/item.js';
import { storage } from './storage.js';

export async function createItemHandler(data: unknown) {
    // Implementation goes here
    try {
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