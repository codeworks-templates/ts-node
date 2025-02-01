import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath, parse } from 'url';
import { Router } from './Router.ts';
import DocsController from './DocsController.ts';
import { ApiController } from './ApiController.ts';
import { CacheManager } from './CacheManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cache = new CacheManager();
const router = new Router();

const OPTIONS_HEADERS = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

const CORS_HEADERS = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Credentials': 'true',
  // 'Access-Control-Expose-Headers': 'Authorization',
  'Access-Control-Max-Age': '86400'
})



export async function registerControllers() {
  const controllersPath = path.join(__dirname, '../', 'controllers');
  const controllerFiles = fs.readdirSync(controllersPath);

  for (const file of controllerFiles) {
    if (file.endsWith('.ts')) {
      const filePath = path.join(controllersPath, file);
      const fileUrl = new URL(`file://${filePath}`);
      const { default: ControllerClass } = await import(fileUrl.href);
      const controller = new ControllerClass();
      router.registerController(controller);
    }
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
    const docsController = new DocsController(router.routes);
    router.registerController(docsController);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export async function UseApiControllers(req: http.IncomingMessage, res: http.ServerResponse) {
  const method = req.method!;
  const parsedUrl = parse(req.url!, true);
  const query = parsedUrl.query;
  let path = parsedUrl.pathname!;

  if (path.endsWith('/')) path = path.slice(0, -1);

  if (method === 'OPTIONS') {
    res.setHeaders(OPTIONS_HEADERS);
    res.statusCode = 200;
    res.end();
    return;
  }

  res.setHeaders(CORS_HEADERS);
  res.statusCode = 200;

  const body = await parseBody(req);
  const routeHandler = router.getHandler(method, path);

  if (!routeHandler) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  const cacheKey = router.generateCacheKey(req, query as any);

  if (method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.end(JSON.stringify(cached));
      return;
    }
  }

  const params = routeHandler.params;

  const context = { params, query, body, req, res };
  let result = await ApiController.handleRequest(routeHandler.handler, routeHandler.middleware, context);

  result = result || { statusCode: 500, error: new Error('[Internal Server Error] Request not handled or timed out') };

  res.statusCode = result.statusCode || 500;

  if (result.error) {
    res.end(JSON.stringify({
      error: result.error.message,
      statusCode: res.statusCode,
      stack: process.env.NODE_ENV === 'development' ? result.error.stack : undefined
    }));
    return;
  }

  if (method === 'GET' && result.body) {
    cache.set(cacheKey, result.body);
  }

  if (result.body) {
    res.end(JSON.stringify(result.body));
    return
  }

}
