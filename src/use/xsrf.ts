import { Layer, Middleware } from '../types';

export const xsrf: Middleware = (next: Layer) => async (req: Request) => {
  // Credits: https://stackoverflow.com/a/59603055/925307
  const token = ('; ' + document.cookie)
    .split(`; XSRF-TOKEN=`)
    .pop()
    ?.split(';')[0];

  if (token) {
    // https://stackoverflow.com/questions/44652194/laravel-decryptexception-the-payload-is-invalid
    req.headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
  }

  return next(req);
};
