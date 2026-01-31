import { storage } from './storage.js';

export async function listItemsHandler(query: Record<string, string | undefined>) {
    // Implementation goes here
    try {
        const items = await storage.listItems(query);

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