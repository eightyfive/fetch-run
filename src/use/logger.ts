import { Layer, Middleware } from '../types';

export const logger: Middleware = (next: Layer) => async (req: Request) => {
  const res = await next(req);

  let data;

  if (res.headers.get('Content-Type') === 'application/json') {
    data = await res.clone().json();
  }

  const title = `${req.method} ${req.url} (${res.status})`;

  if (res.status >= 300) {
    if (data) {
      console.log(prettify(data));
    }

    console.error(title);

    if (data?.message) {
      console.error(data.message);
    }
  } else {
    console.log(title);

    if (data) {
      console.log(prettify(data));
    }
  }

  return res;
};

function prettify(data: any) {
  return JSON.stringify(data, null, 2);
}
