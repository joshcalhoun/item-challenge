import { ItemIdSchema } from '../validation/schemas.js';
import { storage } from './storage.js';


export async function getItemHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid item ID', details: parsedId.error.errors },
            };
        }

        const item = await storage.getItem(parsedId.data);

        if (!item) {
            throw new Error('Item not found');
        }

        return {
            statusCode: 200,
            body: item,
        };
    } catch (error) {
        console.error('Error retrieving item:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}