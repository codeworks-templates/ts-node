import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ApiController, Ok, BadRequest, type FromClient, type ActionResult } from '../utils/ApiController.ts';
import { Router } from '../utils/Router.ts';


const router = new Router()

const invocations = {
  middlewareOk: 0,
  middlewareBadRequest: 0,
  globalMiddleware: 0,
}

function globalMiddleware(context: FromClient) {
  console.log('Global Middleware', ++invocations.globalMiddleware);
  return;
}

const middlewareBadRequest = async (context: FromClient): Promise<ActionResult<any>> => {
  console.log('Middleware Bad Request', ++invocations.middlewareBadRequest);
  throw BadRequest('Middleware Error');
}

const middlewareOk = async (context: FromClient): Promise<ActionResult<any>> => {
  console.log('Middleware OK', ++invocations.middlewareOk);
  return
}


const VALID_CONTEXT = { req: {} as any, query: {}, params: {}, body: {} };

class TestController extends ApiController {
  constructor() {
    super('/test', [globalMiddleware]);
    this
      .get('/ok', this.okHandler)
      .post('/bad', this.badHandler)
      .get('/middleware/ok', this.okHandler, [middlewareOk])
      .get('/middleware/bad', this.okHandler, [middlewareBadRequest]);
  }

  async okHandler(): Promise<ActionResult<string>> {
    return Ok('OK');
  }

  async badHandler(): Promise<ActionResult<string>> {
    return BadRequest('Bad Request');
  }
}

router.registerController(new TestController());

describe('BaseController', () => {

  it('should register routes correctly', () => {
    const controller = new TestController();
    assert.strictEqual(controller.routes.length, 4);
    assert.strictEqual(controller.routes[0].path, '/ok');
    assert.strictEqual(controller.routes[0].method, 'GET');
    assert.strictEqual(controller.routes[1].path, '/bad');
    assert.strictEqual(controller.routes[1].method, 'POST');
  });

  it('should handle GET request correctly', async () => {
    const controller = router.getHandler('GET', '/test/ok');
    assert(controller, 'Controller should be found');
    const result = await controller.handler(VALID_CONTEXT);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.body, 'OK');
  });

  it('should handle POST request correctly', async () => {
    const controller = router.getHandler('POST', '/test/bad');
    assert(controller, 'Controller should be found');
    const result = await controller.handler(VALID_CONTEXT);
    assert(result);
    assert.strictEqual(result.statusCode, 400);
    assert.strictEqual(result.error.message, 'Bad Request');
  });

  it('should execute middleware correctly', async () => {
    const controller = router.getHandler('GET', '/test/middleware/ok');

    const result = await ApiController.handleRequest(controller.handler, controller.middleware, VALID_CONTEXT);
    assert(result, 'Result should be returned');
    assert.strictEqual(invocations.middlewareOk, 1, 'Middleware should be called once');
    assert.strictEqual(invocations.globalMiddleware, 1, 'Global middleware should be called once');
  });

  it('can handle thrown errors during the request', async () => {
    const controller = router.getHandler('GET', '/test/middleware/bad');

    const result = await ApiController.handleRequest(controller.handler, controller.middleware, VALID_CONTEXT);
    assert(result, 'Result should be returned');
    assert.strictEqual(result.statusCode, 400);
    assert.strictEqual(result.error.message, 'Middleware Error', 'Middleware should return error');
    assert.strictEqual(invocations.middlewareBadRequest, 1, 'Middleware should be called once');
    assert.strictEqual(invocations.globalMiddleware, 2, 'Global middleware should be called twice');
  });

});