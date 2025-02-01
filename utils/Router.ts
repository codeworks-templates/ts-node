import http from 'http';
import { ApiController, type Middleware, type RequestHandler } from './ApiController.ts';
import { logger } from './Logger.ts';

type RouteHandler = {
  handler: RequestHandler<any>;
  middleware: Middleware<any>[];
  description: string;
  url: string;
  keys?: { [key: string]: string };
  params: Record<string, string>;
}

class RouterRegistry {
  routes: Record<string, any> = {};
  controllers = new Map<string, ApiController>();

  registerController(controller: ApiController) {

    if (this.controllers.has(controller.basePath)) {
      // logger.warn(`Controller with basePath ${controller.basePath} already exists`);
      throw new Error(`Controller with basePath ${controller.basePath} already exists found in ${controller.constructor.name}`);
    }

    this.controllers.set(controller.basePath, controller);

    for (const route of controller.routes) {
      const method = route.method.toUpperCase();
      const url = `${controller.basePath}${route.path}`;
      const pathSegments = this.normalizePath(url).split('/').filter(Boolean);

      if (!this.routes[method]) {
        this.routes[method] = {};
      }

      let currentNode = this.routes[method];

      for (const segment of pathSegments) {
        if (segment.startsWith(':')) {
          const param = segment.substring(1);
          currentNode[':param'] = currentNode[':param'] || { keys: {} };
          currentNode[':param'].keys[param] = param;
          currentNode = currentNode[':param'];
        } else {
          currentNode[segment] = currentNode[segment] || {};
          currentNode = currentNode[segment];
        }
      }

      currentNode._handler = {
        handler: route.handler,
        middleware: route.middleware,
        url,
        description: route.description || route.handler.name || 'No description provided'
      };
    }
  }

  getHandler(method: string, path: string) {
    return this.match(method, path);
  }

  match(method: string, path: string): RouteHandler | null {
    const methodRoutes = this.routes[method.toUpperCase()];
    if (!methodRoutes) return null;

    const pathSegments = this.normalizePath(path).split('/').filter(Boolean);
    let currentNode = methodRoutes;
    let params: Record<string, string> = {};

    for (const segment of pathSegments) {
      if (currentNode[segment]) {
        currentNode = currentNode[segment];
      } else if (currentNode[':param']) {
        const paramKeys = currentNode[':param'].keys;
        for (const key in paramKeys) {
          params[key] = segment;
        }
        currentNode = currentNode[':param'];
      } else {
        return null;
      }
    }

    return currentNode._handler ? { ...currentNode._handler, params } : null;
  }

  private normalizePath(path: string): string {
    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  }
}

export class Router {
  private registry!: RouterRegistry;

  constructor() {
    this.registry = new RouterRegistry();
  }

  registerController(controller: ApiController) {
    this.registry.registerController(controller);
  }

  getHandler(method: string, path: string) {
    return this.registry.getHandler(method, path);
  }

  generateCacheKey(req: http.IncomingMessage, query: { [x: string]: string }): string {
    return `${req.method}-${req.url}${JSON.stringify(query)}`;
  }

  get routes() {
    return this.registry.routes;
  }

}