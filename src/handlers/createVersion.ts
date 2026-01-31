import { storage } from './storage';

export async function createVersionHandler(id: string) {
    try {
        // Assuming there's a method to create a version in storage
        const newVersion = await storage.createVersion(id);

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