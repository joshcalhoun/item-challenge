import { ListItemsQuery } from '../types/item.js';
import { ListItemsQuerySchema } from '../validation/schemas.js';
import { storage } from './storage.js';

export async function listItemsHandler(query: Record<string, string | undefined>) {
    try {

        const parsedListItem = ListItemsQuerySchema.safeParse(query);
        if (!parsedListItem.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid query parameters', details: parsedListItem.error.errors },
            };
        }

        const items = await storage.listItems(parsedListItem.data as ListItemsQuery);

        return {
            statusCode: 200,
            body: items,
        };
    } catch (error) {
        console.error('Error listing items:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}