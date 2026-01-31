import { storage } from './storage.js';



export async function updateItemHandler(id: string, data: any) {
    // Implementation goes here
    try {
        const updatedItem = await storage.updateItem(id, data);

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