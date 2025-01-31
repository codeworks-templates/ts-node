import type { RequestHandler } from '../utils/ApiController.ts';

export const requestLogger: RequestHandler<any> = async (ctx) => {
  console.log('Request Log:', ctx);
  return null;
};