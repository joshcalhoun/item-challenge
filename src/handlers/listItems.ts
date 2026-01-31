import { ListItemsQuery } from '../types/item.js';
import { ListItemsQuerySchema } from '../validation/schemas.js';
import { InvalidCursorError } from '../storage/errors.js';
import { cursorError, internalError, validationError } from './errors.js';
import { storage } from './storage.js';

export async function listItemsHandler(query: Record<string, string | undefined>) {
    try {

        const parsedListItem = ListItemsQuerySchema.safeParse(query);
        if (!parsedListItem.success) {
            return validationError(parsedListItem.error.issues);
        }

        const items = await storage.listItems(parsedListItem.data as ListItemsQuery);

        return {
            statusCode: 200,
            body: items,
        };
    } catch (error) {
        if (error instanceof InvalidCursorError) {
            return cursorError();
        }
        console.error('Error listing items:', error);
        return internalError();
    }
}