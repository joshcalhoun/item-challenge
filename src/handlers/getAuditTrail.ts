import { ItemIdSchema } from '../validation/schemas.js';
import { auditTrailNotFoundError, internalError, invalidIdError } from './errors.js';
import { storage } from './storage.js';

export async function getAuditTrailHandler(id: string) {
    try {
        const parsedId = ItemIdSchema.safeParse(id);
        if (!parsedId.success) {
            return invalidIdError();
        }

        const versions = await storage.getAuditTrail(parsedId.data);

        if (!versions || versions.length === 0) {
            return auditTrailNotFoundError();
        }
        return {
            statusCode: 200,
            body: { itemId: parsedId.data, versions, total: versions.length},
        };
    } catch (error) {
        console.error('Error getting audit trail:', error);
        return internalError();
    }
}