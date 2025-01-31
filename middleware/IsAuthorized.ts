import { type RequestHandler, Unauthorized } from '../utils/ApiController.ts';

export const isAuthorized: RequestHandler<any> = async (ctx) => {
  const { headers } = ctx.req;
  if (!headers.authorization?.startsWith('Bearer ')) {
    return Unauthorized('Invalid token');
  }
  return null;
}
