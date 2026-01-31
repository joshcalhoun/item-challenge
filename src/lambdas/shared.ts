export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  body?: string | null;
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function parseLambdaEvent(event: APIGatewayEvent) {
  if (!event.body) {
    return { headers: CORS_HEADERS, body: null, parseError: false };
  }
  try {
    return {
      headers: CORS_HEADERS,
      body: JSON.parse(event.body),
      parseError: false,
    };
  } catch {
    return { headers: CORS_HEADERS, body: null, parseError: true };
  }
}

export function createLambdaResponse(
  statusCode: number,
  body: object,
  headers: Record<string, string>,
): APIGatewayResponse {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): number {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

export const logger = {
  debug: (msg: string, data?: unknown) => {
    if (getLogLevel() <= LOG_LEVELS.debug) {
      console.debug(JSON.stringify({ level: 'debug', msg, data }));
    }
  },
  info: (msg: string, data?: unknown) => {
    if (getLogLevel() <= LOG_LEVELS.info) {
      console.info(JSON.stringify({ level: 'info', msg, data }));
    }
  },
  warn: (msg: string, data?: unknown) => {
    if (getLogLevel() <= LOG_LEVELS.warn) {
      console.warn(JSON.stringify({ level: 'warn', msg, data }));
    }
  },
  error: (msg: string, data?: unknown) => {
    if (getLogLevel() <= LOG_LEVELS.error) {
      console.error(JSON.stringify({ level: 'error', msg, data }));
    }
  },
};
