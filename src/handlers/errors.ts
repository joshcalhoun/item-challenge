import type { ZodIssue } from 'zod';



export type ErrorCode = 
| 'VALIDATION_ERROR'
| 'ITEM_NOT_FOUND'
| 'INVALID_ID'
| 'INTERNAL_ERROR'
| 'INVALID_JSON'
| 'AUDIT_TRAIL_NOT_FOUND';

interface ErrorBody {
    error: {
        code: ErrorCode;
        message: string;
        details?: ZodIssue[];
    };
}

interface ErrorResponse {
    statusCode: number;
    body: ErrorBody;
}


export const createErrorResponse = (statusCode: number, code: ErrorCode, message: string, details?: ZodIssue[]): ErrorResponse => {
    const body: ErrorBody = {
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    };
    return {
        statusCode,
        body,
    };
};


export const validationError = (issues: ZodIssue[]): ErrorResponse => createErrorResponse(400, 'VALIDATION_ERROR', 'Validation failed', issues);

export const invalidIdError = (): ErrorResponse => createErrorResponse(400, 'INVALID_ID', 'The provided ID is not a valid UUID');

export const itemNotFoundError = (): ErrorResponse => createErrorResponse(404, 'ITEM_NOT_FOUND', 'The requested item was not found');

export const auditTrailNotFoundError = (): ErrorResponse => createErrorResponse(404, 'AUDIT_TRAIL_NOT_FOUND', 'The audit trail for the requested item was not found');

export const internalError = (): ErrorResponse => createErrorResponse(500, 'INTERNAL_ERROR', 'An internal server error occurred');

export const invalidJsonError = (): ErrorResponse => createErrorResponse(400, 'INVALID_JSON', 'The request body contains invalid JSON');
