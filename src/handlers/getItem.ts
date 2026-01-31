import { storage } from './storage.js';


export async function getItemHandler(id: string) {
    // Implementation goes here
    try {
        const item = await storage.getItem(id);

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