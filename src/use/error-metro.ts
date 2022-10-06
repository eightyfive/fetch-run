import { HTTPError } from '../error';
import { Layer, Middleware } from '../types';

export const errorMetro: Middleware =
  (next: Layer) => async (request: Request) => {
    const req = request.clone();

    const response = await next(request);

    const res = response.clone();

    if (response.ok) {
      return response;
    }

    // When throwing a custom `Error`:

    // throw new HTTPError(res, req);

    // Metro bundler somehow tries to fetch <app-root>/HTTPError@...
    // Resulting in `Error: ENOENT: no such file or directory` in console.

    // This is the workaround (throw a normal `Error`)
    const err = new Error(
      res.statusText ? `${res.statusText} (${res.status})` : `${res.status}`,
    );

    (err as HTTPError).name = 'HTTPError';
    (err as HTTPError).code = res.status;
    (err as HTTPError).request = req;
    (err as HTTPError).response = res;

    throw err as HTTPError;
  };
