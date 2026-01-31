import { updateItemHandler } from '../../src/handlers/updateItem.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('updateItem invoked', { path: event.path, pathParameters: event.pathParameters });
  const { headers, body, parseError } = parseLambdaEvent(event);
  const id = event.pathParameters?.id;

  if (!id) {
    logger.warn('updateItem missing item ID');
    return createLambdaResponse(400, { error: { code: 'INVALID_ID', message: 'Missing item ID' } }, headers);
  }

  if (parseError) {
    return createLambdaResponse(400, { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } }, headers);
  }

  if (body === null || body === undefined) {
    return createLambdaResponse(400, { error: { code: 'MISSING_BODY', message: 'Request body is required' } }, headers);
  }

  logger.debug('updateItem parsed body', { id, body });
  const result = await updateItemHandler(id, body);
  logger.debug('updateItem result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
