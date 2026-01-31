import { CreateItemRequest } from '../types/item.js';
import { CreateItemSchema } from '../validation/schemas.js';
import { internalError, validationError } from './errors.js';
import { storage } from './storage.js';

export async function createItemHandler(data: unknown) {
    try {

        const parsed = CreateItemSchema.safeParse(data);
        if (!parsed.success) {
            return validationError(parsed.error.issues);
        }

        const newItem = await storage.createItem(parsed.data);

        return {
            statusCode: 201,
            body: newItem,
        };
    } catch (error) {
        console.error('Error creating item:', error);
        return internalError();
    }
}