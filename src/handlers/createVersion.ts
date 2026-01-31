import { ItemIdSchema } from '../validation/schemas.js';
import { internalError, invalidIdError, itemNotFoundError } from './errors.js';
import { storage } from './storage.js';

export async function createVersionHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return invalidIdError();
        }
        const newVersion = await storage.createVersion(parsedId.data);

        if (!newVersion) {
            return itemNotFoundError();
        }

        return {
            statusCode: 201,
            body: newVersion,
        };
    } catch (error) {
        console.error('Error creating version:', error);
        return internalError();
    }
}