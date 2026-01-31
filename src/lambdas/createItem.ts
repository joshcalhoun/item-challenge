import { createItemHandler } from '../../src/handlers/createItem.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('createItem invoked', { path: event.path });
  const { headers, body, parseError } = parseLambdaEvent(event);

  if (parseError) {
    return createLambdaResponse(400, { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } }, headers);
  }

  if (body === null || body === undefined) {
    return createLambdaResponse(400, { error: { code: 'MISSING_BODY', message: 'Request body is required' } }, headers);
  }

  logger.debug('createItem parsed body', { body });
  const result = await createItemHandler(body);
  logger.debug('createItem result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
