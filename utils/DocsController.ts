import { type ActionResult, ApiController, Ok, type RequestHandler } from './ApiController.ts';

interface HandlerDetails {
  middleware?: Function[];
  url?: string;
  description?: string;
}

function extractReadableDocs(paths: RequestHandler<any>[]) {
  const result = [];

  function traverse(node: any, method: string, basePath = ""): void {
    if (!node || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
      if (key === "_handler") {
        const handlerDetails = value as HandlerDetails;
        const middleware = (handlerDetails.middleware || [])
          .map(fn => (fn ? fn.name || "Anonymous Function" : "None"));
        result.push({
          method,
          url: basePath || handlerDetails.url || "/",
          description: handlerDetails.description || "No description provided",
          middleware: middleware.length ? middleware : ["None"],
        });
      } else if (key === ":param") {
        const paramKey = Object.keys((value as any).keys || {}).join("/");
        traverse(value, method, `${basePath}/:${paramKey}`);
      } else {
        traverse(value, method, basePath ? `${basePath}/${key}` : `/${key}`);
      }
    }
  }

  for (const [method, routes] of Object.entries(paths)) {
    traverse(routes, method);
  }

  return result;
}



type RouteDescription = {
  method: string;
  url: string;
  description: string;
  middleware: string[];
};

export default class DocsController extends ApiController {

  normalizedRoutes!: RouteDescription[];
  resourceRoutes!: { [resource: string]: RouteDescription[] };
  constructor(paths) {
    super('/docs');
    console.log('paths', paths);
    this.normalizedRoutes = extractReadableDocs(paths);
    this.resourceRoutes = this.normalizedRoutes.reduce((acc, route) => {
      const urlSegments = route.url.split("/");
      if (urlSegments[0] === "") urlSegments.shift();
      if (urlSegments[0] === "docs") urlSegments.shift();
      if (urlSegments[0] === "api") urlSegments.shift();
      let resource = urlSegments[0];

      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(route);
      return acc;
    }, {});
    this
      .get('', this.getDocs.bind(this), [], 'Get a list of all available routes')
      .get('/:resource', this.getDocsForResource.bind(this), [], 'Get a list of all available routes for a specific resource');

  }

  async getDocs(): Promise<ActionResult<any>> {
    return Ok(this.normalizedRoutes);
  }

  async getDocsForResource({ params }): Promise<ActionResult<any>> {
    const resource = params.resource;
    let endpoints = [];

    if (this.resourceRoutes[resource]) {
      endpoints = this.resourceRoutes[resource];
    }

    return Ok(endpoints);
  }

}