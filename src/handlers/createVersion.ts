import { ItemIdSchema } from '../validation/schemas.js';
import { ConflictError } from '../storage/errors.js';
import { conflictError, internalError, invalidIdError, itemNotFoundError } from './errors.js';
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
        if (error instanceof ConflictError) {
            return conflictError();
        }
        console.error('Error creating version:', error);
        return internalError();
    }
}