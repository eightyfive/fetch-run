import { Layer, Middleware } from '../types';

export const logger: Middleware = (next: Layer) => async (req: Request) => {
  const res = await next(req);

  let data;

  if (res.headers.get('Content-Type') === 'application/json') {
    data = await res.clone().json();
  }

  console.groupCollapsed(req.url);
  console.log(req);
  console.log(res);

  if (data) {
    console.log(data);
  }

  console.groupEnd();

  if (res.status >= 300) {
    console.group(`Server Error (${res.status})`);

    if (data) {
      console.error(data.message);

      if (data.exception) {
        console.log(data.exception);
      }

      if (data.file) {
        console.log(`${data.file} (${data.line})`);
      }

      console.log(data.trace);
      console.groupEnd();
    }
  }

  return res;
};
