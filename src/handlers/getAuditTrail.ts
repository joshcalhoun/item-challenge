import { ItemIdSchema } from '../validation/schemas.js';
import { storage } from './storage.js';

export async function getAuditTrailHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return {
                statusCode: 400,
                body: { error: 'Invalid item ID', details: parsedId.error.errors },
            };
        }

        const versions = await storage.getAuditTrail(parsedId.data);

        if (!versions) {
            throw new Error('Audit trail not found');
        }
        if (versions.length === 0) {
            throw new Error('No audit trail entries found');
        }
        return {
            statusCode: 200,
            body: { itemId: parsedId.data, versions, total: versions.length},
        };
    } catch (error) {
        console.error('Error getting audit trail:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}