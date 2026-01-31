import { ItemIdSchema } from '../validation/schemas';
import { storage } from './storage';

export async function createVersionHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid item ID', details: parsedId.error.errors },
            };
        }

        const newVersion = await storage.createVersion(parsedId.data);

        if (!newVersion) {
            throw new Error('Failed to create version');
        }

        return {
            statusCode: 201,
            body: newVersion,
        };
    } catch (error) {
        console.error('Error creating version:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}