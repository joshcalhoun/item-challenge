import { ItemIdSchema, UpdateItemSchema } from '../validation/schemas.js';
import { internalError, invalidIdError, itemNotFoundError, validationError } from './errors.js';
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
        console.error('Error updating item:', error);
        return internalError();
    }
}