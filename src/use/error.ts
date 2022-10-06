import { HTTPError } from '../error';
import { Layer, Middleware } from '../types';

export const error: Middleware = (next: Layer) => async (request: Request) => {
  const req = request.clone();

  const response = await next(request);

  const res = response.clone();

  if (response.ok) {
    return response;
  }

  throw new HTTPError(res, req);
};
