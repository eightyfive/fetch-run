import { Layer, Middleware } from '../types';

const RE_HOSTNAME = /^https?:\/\/[\w-\.:]+/;

type LoggerOptions = {
  verbose: boolean;
};

export function createLogger({ verbose }: LoggerOptions) {
  return (next: Layer) => async (request: Request) => {
    const req = request.clone();

    const response = await next(request);

    const res = response.clone();

    const pathname = req.url.replace(RE_HOSTNAME, '');

    let contents = `${req.method} ${pathname ?? '/'} (${res.status})`;

    if (verbose && res.headers.get('Content-Type') === 'application/json') {
      // Log request data
      try {
        contents += '\n';
        contents += prettify(await req.json());
      } catch (err) {
        // Ignore
      }

      const data = await res.json();

      // Log response data
      if (data) {
        contents += '\n';
        contents += prettify(data);
      }
    }

    if (res.status >= 300) {
      console.error(contents);
    } else {
      console.log(contents);
    }

    return response;
  };
}

export const logger: Middleware = createLogger({ verbose: true });

function prettify(data: any) {
  return JSON.stringify(data, null, 2);
}
