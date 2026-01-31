import { listItemsHandler } from '../../src/handlers/listItems.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('listItems invoked', { path: event.path, query: event.queryStringParameters });
  const { headers } = parseLambdaEvent(event);
  const result = await listItemsHandler(event.queryStringParameters || {});
  logger.debug('listItems result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
