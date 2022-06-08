import { Layer, Middleware } from '../types';

export const json: Middleware = (next: Layer) => async (req: Request) => {
  const res = await next(req);

  if (res.headers.get('Content-Type') === 'application/json') {
    return res.json();
  }

  return res;
};
