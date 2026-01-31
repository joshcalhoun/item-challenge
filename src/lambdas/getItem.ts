import { getItemHandler } from '../../src/handlers/getItem.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('getItem invoked', { path: event.path, pathParameters: event.pathParameters });
  const { headers } = parseLambdaEvent(event);
  const id = event.pathParameters?.id;

  if (!id) {
    logger.warn('getItem missing item ID');
    return createLambdaResponse(400, { error: { code: 'INVALID_ID', message: 'Missing item ID' } }, headers);
  }

  const result = await getItemHandler(id);
  logger.debug('getItem result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
