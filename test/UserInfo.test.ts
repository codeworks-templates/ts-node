import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ApiController, Ok, BadRequest, type FromClient, type ActionResult, AuthorizedRequest } from '../utils/ApiController.ts';
import { Router } from '../utils/Router.ts';
import { isAuthorized } from '../middleware/IsAuthorized.ts';


const router = new Router()

const invocations = {
  middlewareOk: 0,
  middlewareBadRequest: 0,
  globalMiddleware: 0,
}

const VALID_CONTEXT = { req: {} as any, query: {}, params: {}, body: {} };


class TestController extends ApiController {
  constructor() {
    super('/test');
    this
      .get('/ok', this.okHandler, [isAuthorized])
  }

  async okHandler({ userInfo, identity }: AuthorizedRequest) {


    return Ok('OK');
  }
}

router.registerController(new TestController());

describe('BaseController', () => {



  it('should handle GET request correctly', async () => {
    const controller = router.getHandler('GET', '/test/ok');
    assert(controller, 'Controller should be found');
    const result = await controller.handler(VALID_CONTEXT);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.body, 'OK');
  });



});