import { ItemIdSchema, UpdateItemSchema } from '../validation/schemas.js';
import { storage } from './storage.js';



export async function updateItemHandler(id: string, data: unknown) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid item ID', details: parsedId.error.errors },
            };
        }

        const parsedData = UpdateItemSchema.safeParse(data);
        if (!parsedData.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid update data', details: parsedData.error.errors },
            };
        }

        const updatedItem = await storage.updateItem(parsedId.data, parsedData.data);

        if (!updatedItem) {
            throw new Error('Item not found for update');
        }

        return {
            statusCode: 200,
            body: updatedItem,
        };
    } catch (error) {
        console.error('Error updating item:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}