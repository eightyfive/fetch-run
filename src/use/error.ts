import { HTTPError } from '../error';
import { Layer, Middleware } from '../http';

export const error: Middleware = (next: Layer) => async (req: Request) => {
  const res = await next(req);

  if (res.ok) {
    return res;
  }

  throw new HTTPError(res.status, res.statusText, req.clone(), res.clone());
};
