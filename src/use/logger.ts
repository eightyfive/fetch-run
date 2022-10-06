import { Layer, Middleware } from '../types';

const RE_HOSTNAME = /^https?:\/\/[\w-\.:]+/;

export const logger: Middleware = (next: Layer) => async (request: Request) => {
  const req = request.clone();

  const response = await next(request);

  const res = response.clone();

  const pathname = req.url.replace(RE_HOSTNAME, '');

  let contents = `${req.method} ${pathname || '/'} (${res.status})`;

  if (res.headers.get('Content-Type') === 'application/json') {
    if (req.method !== 'GET') {
      contents += '\n';
      contents += prettify(await req.json());
    }

    contents += '\n';
    contents += prettify(await res.json());
  }

  if (res.status >= 300) {
    console.error(contents);
  } else {
    console.log(contents);
  }

  return response;
};

function prettify(data: any) {
  return JSON.stringify(data, null, 2);
}
