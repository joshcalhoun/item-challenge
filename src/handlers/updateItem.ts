import { ItemIdSchema, UpdateItemSchema } from '../validation/schemas.js';
import { ConflictError } from '../storage/errors.js';
import { conflictError, internalError, invalidIdError, itemNotFoundError, validationError } from './errors.js';
import { storage } from './storage.js';



export async function updateItemHandler(id: string, data: unknown) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return invalidIdError();
        }

        const parsedData = UpdateItemSchema.safeParse(data);
        if (!parsedData.success) {
            return validationError(parsedData.error.issues);
        }

        const updatedItem = await storage.updateItem(parsedId.data, parsedData.data);

        if (!updatedItem) {
            return itemNotFoundError();
        }

        return {
            statusCode: 200,
            body: updatedItem,
        };
    } catch (error) {
        if (error instanceof ConflictError) {
            return conflictError();
        }
        console.error('Error updating item:', error);
        return internalError();
    }
}