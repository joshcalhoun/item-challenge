import { createVersionHandler } from '../../src/handlers/createVersion.js';
import { createLambdaResponse, parseLambdaEvent, logger, type APIGatewayEvent } from './shared.js';

export async function handler(event: APIGatewayEvent) {
  logger.debug('createVersion invoked', { path: event.path, pathParameters: event.pathParameters });
  const { headers } = parseLambdaEvent(event);
  const id = event.pathParameters?.id;

  if (!id) {
    logger.warn('createVersion missing item ID');
    return createLambdaResponse(400, { error: { code: 'INVALID_ID', message: 'Missing item ID' } }, headers);
  }

  const result = await createVersionHandler(id);
  logger.debug('createVersion result', { statusCode: result.statusCode });
  return createLambdaResponse(result.statusCode, result.body, headers);
}
