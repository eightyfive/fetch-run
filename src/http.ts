import qs from 'query-string';
import _trimEnd from 'lodash/trimEnd';

export type Layer = (req: Request) => Promise<Response>;

export type Middleware = (next: Layer) => Layer;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JSONObject = { [key: string]: string | number | boolean | null };

export type BodyData = FormData | JSONObject;

export class Http {
  baseURI: string;
  options: RequestInit;
  stack: Layer;

  constructor(baseURI: string, options?: RequestInit) {
    this.baseURI = _trimEnd(baseURI, '/');
    this.options = Object.assign({ headers: {} }, options);

    this.stack = (req: Request) => fetch(req);
  }

  use(middleware: Middleware) {
    this.stack = middleware(this.stack);
  }

  run(req: Request) {
    return this.stack(req);
  }

  setHeader(name: string, value: string) {
    Object.assign(this.options.headers, { [name]: value });
  }

  setBearer(token: string) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  get(path: string, options?: RequestInit) {
    return this.request('GET', path, undefined, options);
  }

  post(path: string, data: BodyData, options?: RequestInit) {
    return this.request('POST', path, data, options);
  }

  put(path: string, data: BodyData, options?: RequestInit) {
    return this.request('PUT', path, data, options);
  }

  patch(path: string, data: BodyData, options?: RequestInit) {
    return this.request('PATCH', path, data, options);
  }

  delete(path: string, options?: RequestInit) {
    return this.request('DELETE', path, undefined, options);
  }

  search(path: string, query: JSONObject, options?: RequestInit) {
    return this.request(
      'GET',
      `${path}?${qs.stringify(query)}`,
      undefined,
      options,
    );
  }

  request(
    method: Method,
    path: string,
    data: BodyData | undefined,
    options?: RequestInit,
  ) {
    // Headers
    const headers: HeadersInit = Object.assign(
      {},
      this.options.headers,
      options ? options.headers : undefined,
    );

    // Init
    const init: RequestInit = Object.assign({}, options, {
      method,
      headers: new Headers(headers),
    });

    if (data && method !== 'GET') {
      init.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    // Request
    const req = new Request(`${this.baseURI}/${path}`, init);

    return this.run(req);
  }
}
