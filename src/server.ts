import { createServer, IncomingMessage, ServerResponse } from 'http';
import {
  getItemHandler,
  createItemHandler,
  updateItemHandler,
  listItemsHandler,
  createVersionHandler,
  getAuditTrailHandler,
} from './handlers/index.js';

const PORT = process.env.PORT || 3000;

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const { method } = req;

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Parse request body
  let body = '';
  req.on('data', (chunk: Buffer) => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  let parsedBody: unknown = null;
  if (body) {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } }));
      return;
    }
  }


  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    let result;

    // Match routes (longest paths first)
    const versionMatch = pathname.match(/^\/api\/items\/([^/]+)\/versions$/);
    const auditMatch = pathname.match(/^\/api\/items\/([^/]+)\/audit$/);
    const itemIdMatch = pathname.match(/^\/api\/items\/([^/]+)$/);

    if (method === 'POST' && versionMatch) {
      result = await createVersionHandler(versionMatch[1]);
    } else if (method === 'GET' && auditMatch) {
      result = await getAuditTrailHandler(auditMatch[1]);
    } else if (method === 'PUT' && itemIdMatch) {
      result = await updateItemHandler(itemIdMatch[1], parsedBody);
    } else if (method === 'GET' && pathname === '/api/items') {
      const query: Record<string, string> = {};
      parsedUrl.searchParams.forEach((value, key) => { query[key] = value; });
      result = await listItemsHandler(query);
    } else if (method === 'POST' && pathname === '/api/items') {
      result = await createItemHandler(parsedBody);
    } else if (method === 'GET' && itemIdMatch) {
      result = await getItemHandler(itemIdMatch[1]);
    } else {
      result = {
        statusCode: 404,
        body: { error: { code: 'ITEM_NOT_FOUND', message: 'Route not found' } },
      };
    }

    res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }));
  }
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   http://localhost:${PORT}/api/items`);
  console.log(`  GET    http://localhost:${PORT}/api/items`);
  console.log(`  GET    http://localhost:${PORT}/api/items/:id`);
  console.log(`  PUT    http://localhost:${PORT}/api/items/:id`);
  console.log(`  POST   http://localhost:${PORT}/api/items/:id/versions`);
  console.log(`  GET    http://localhost:${PORT}/api/items/:id/audit`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
