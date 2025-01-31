import assert from 'node:assert';
import { describe, it } from 'node:test';
import { isAuthorized } from '../middleware/IsAuthorized.ts';

describe('isAuthorized Middleware', () => {

  const validContext = {
    req: {
      headers: {
        authorization: 'Bearer valid_token',
      }
    }
  }

  const invalidContext = {
    req: {
      headers: {}
    }
  }

  it('should return null if the token is valid', async () => {
    const result = await isAuthorized(validContext as any);
    assert.strictEqual(result, null);
  });

  it('should return Unauthorized if the token is invalid', async () => {
    const result = await isAuthorized(invalidContext as any);
    assert.strictEqual(result.statusCode, 401);
    assert.strictEqual(result.error.message, 'Invalid token');
  });

});



