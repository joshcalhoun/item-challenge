import { ItemIdSchema } from '../validation/schemas.js';
import { internalError, invalidIdError, itemNotFoundError } from './errors.js';
import { storage } from './storage.js';


export async function getItemHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return invalidIdError();
        }

        const item = await storage.getItem(parsedId.data);

        if (!item) {
            return itemNotFoundError();
        }

        return {
            statusCode: 200,
            body: item,
        };
    } catch (error) {
        console.error('Error retrieving item:', error);
        return internalError();
    }
}