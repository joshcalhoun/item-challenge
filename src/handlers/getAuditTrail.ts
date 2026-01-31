import { storage } from './storage.js';

export async function getAuditTrailHandler(id: string) {
    try {
        const versions = await storage.getAuditTrail(id);

        if (!versions) {
            throw new Error('Audit trail not found');
        }
        if (versions.length === 0) {
            throw new Error('No audit trail entries found');
        }
        return {
            statusCode: 200,
            body: { itemId: id, versions, total: versions.length},
        };
    } catch (error) {
        console.error('Error getting audit trail:', error);
        return {
            statusCode: 500,
            body: { error: 'Internal Server Error' },
        };
    }
}