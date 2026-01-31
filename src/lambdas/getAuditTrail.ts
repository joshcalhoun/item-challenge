import { getAuditTrailHandler } from '../../src/handlers/getAuditTrail.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('getAuditTrail invoked', { path: event.path, pathParameters: event.pathParameters });
  const { headers } = parseLambdaEvent(event);
  const id = event.pathParameters?.id;

  if (!id) {
    logger.warn('getAuditTrail missing item ID');
    return createLambdaResponse(400, { error: { code: 'INVALID_ID', message: 'Missing item ID' } }, headers);
  }

  const result = await getAuditTrailHandler(id);
  logger.debug('getAuditTrail result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
