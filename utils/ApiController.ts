import http from 'http';
export type ActionResult<T> = {
  statusCode: number;
  error?: Error;
  body?: T;
  headers?: { [key: string]: string };
};

export function Ok<T>(body: T): ActionResult<T> {
  return {
    statusCode: 200,
    body,
  };
}

export function NotFound<T>(error: string): ActionResult<T> {
  return {
    statusCode: 404,
    error: new Error(error),
  };
}

export function InternalServerError<T>(error: string): ActionResult<T> {
  return {
    statusCode: 500,
    error: new Error(error),
  };
}

export function Created<T>(body: T): ActionResult<T> {
  return {
    statusCode: 201,
    body,
  };
}

export function BadRequest<T>(message: string): ActionResult<T> {
  return {
    statusCode: 400,
    error: new Error(message),
  };
}

export function Unauthorized<T>(error: string): ActionResult<T> {
  return {
    statusCode: 401,
    error: new Error(error),
  };
}

export function Forbidden<T>(error: string): ActionResult<T> {
  return {
    statusCode: 403,
    error: new Error(error),
  };
}

export function NoContent<T>(): ActionResult<T> {
  return {
    statusCode: 204,
  };
}

export function Redirect<T>(url: string): ActionResult<T> {
  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
  };
}

export type UserInfo = {
  id: string;
  email: string;
  picture: string;
  name: string;
};

export type Identity = {
  id: string;
  permissions: string[];
};

export interface BaseContext {
  req: http.IncomingMessage;
  query: { [x: string]: string };
  params: { [x: string]: string };
  body: any;
}

export type Middleware<T, C extends BaseContext = BaseContext> = (
  options: C
) => ActionResult<T> | Promise<ActionResult<T>> | void;

export type RequestHandler<T, C extends BaseContext = BaseContext> = (
  options: C
) => ActionResult<T> | Promise<ActionResult<T>>;

export type FromClient<query = {}, params = {}, body = {}> = BaseContext & {
  query: query;
  params: params;
  body: body;
}

export type AuthorizedRequest<query = {}, params = {}, body = {}> = FromClient<query, params, body> & {
  userInfo: UserInfo;
  identity: Identity;
};

export type FromBody<T> = {
  req: http.IncomingMessage;
  body: T;
}

export class ApiController {
  readonly basePath: string;
  readonly routes: {
    path: string;
    method: string;
    handler: RequestHandler<any>;
    middleware: Middleware<any>[];
    description?: string;
  }[] = [];
  middleware: Middleware<any>[] = [];

  constructor(basePath: string, middleware: Middleware<any>[] = []) {
    if (!basePath) {
      throw new Error('Base path is required');
    }
    basePath = basePath.trim();
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath;
    }
    this.basePath = basePath;
    this.middleware = middleware;
  }

  protected registerRoute(
    method: string,
    path: string,
    handler: RequestHandler<any, any>,
    middleware: Middleware<any, any>[] = [],
    description?: string
  ) {
    const cleanedPath = path.startsWith('/') ? path : '/' + path;
    this.routes.push({
      method,
      path: cleanedPath,
      description,
      handler,
      middleware: [...this.middleware, ...middleware],
    });
  }

  static async executeMiddleware(
    middleware: Middleware<any>[],
    context: FromClient<any, any, any>
  ): Promise<ActionResult<any> | null> {
    for (const handler of middleware) {
      const result = await handler(context);
      if (result && result.statusCode >= 400) {
        return result;
      }
    }
    return null;
  }

  static async handleRequest(
    handler: RequestHandler<any>,
    middleware: Middleware<any>[],
    context: FromClient<any, any, any>
  ): Promise<ActionResult<any>> {

    try {
      const middlewareResult = await this.executeMiddleware(middleware, context);
      if (middlewareResult) {
        return middlewareResult;
      }
      return await handler(context);
    } catch (error) {
      if (error.statusCode) {
        return error;
      }
      if (error instanceof Error) {
        return InternalServerError(error.message);
      }
    }
  }

  get<C extends BaseContext>(path: string, handler: RequestHandler<any, C>, middleware: Middleware<any, C>[] = [], description?: string) {
    this.registerRoute('GET', path, handler, middleware, description);
    return this
  }

  post<C extends BaseContext>(path: string, handler: RequestHandler<any, C>, middleware: Middleware<any, C>[] = [], description?: string) {
    this.registerRoute('POST', path, handler, middleware, description);
    return this
  }

  put<C extends BaseContext>(path: string, handler: RequestHandler<any, C>, middleware: Middleware<any, C>[] = [], description?: string) {
    this.registerRoute('PUT', path, handler, middleware, description);
    this
  }

  delete<C extends BaseContext>(path: string, handler: RequestHandler<any, C>, middleware: Middleware<any, C>[] = [], description?: string) {
    this.registerRoute('DELETE', path, handler, middleware, description);
    this
  }

  patch<C extends BaseContext>(path: string, handler: RequestHandler<any, C>, middleware: Middleware<any, C>[] = [], description?: string) {
    this.registerRoute('PATCH', path, handler, middleware, description);
  }


  Ok = Ok;
  NotFound = NotFound;
  InternalServerError = InternalServerError;
  Created = Created;
  BadRequest = BadRequest;
  Unauthorized = Unauthorized;
  Forbidden = Forbidden;
  NoContent = NoContent;
  Redirect = Redirect;

}

