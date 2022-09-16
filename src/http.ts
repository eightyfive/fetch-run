import merge from 'lodash.merge';
import qs from 'query-string';

import { BodyData, Layer, Method, Middleware } from './types';

const { assign } = Object;

const defaultOptions = { headers: {} };

type HttpOptions = RequestInit & {
  headers: HeadersInit;
};

export class Http {
  public baseUrl: string;
  public options: HttpOptions;
  private stack: Layer;

  constructor(url: string, options?: RequestInit) {
    this.baseUrl = url;
    this.options = assign({}, defaultOptions, options);

    this.stack = (req: Request) => fetch(req);
  }

  public use(middleware: Middleware) {
    this.stack = middleware(this.stack);
  }

  public setHeader(name: string, value: string) {
    assign(this.options.headers, { [name]: value });
  }

  public setBearer(token: string) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  public get(path: string, options?: RequestInit) {
    return this.request('GET', path, undefined, options);
  }

  public post(path: string, data: BodyData, options?: RequestInit) {
    return this.request('POST', path, data, options);
  }

  public put(path: string, data: BodyData, options?: RequestInit) {
    return this.request('PUT', path, data, options);
  }

  public patch(path: string, data: BodyData, options?: RequestInit) {
    return this.request('PATCH', path, data, options);
  }

  public delete(path: string, options?: RequestInit) {
    return this.request('DELETE', path, undefined, options);
  }

  public search(path: string, query: object, options?: RequestInit) {
    const params = qs.stringify(query);

    if (!params) {
      return this.request('GET', path, undefined, options);
    }

    return this.request('GET', `${path}?${params}`, undefined, options);
  }

  private request(
    method: Method,
    path: string,
    data: BodyData | undefined,
    options?: RequestInit,
  ): Promise<Response> {
    // Init
    const init: RequestInit = merge({}, this.options, options, {
      method,
    });

    if (data && method !== 'GET') {
      init.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    // Request
    const req = new Request(`${this.baseUrl}/${path}`, init);

    // Response
    return this.run(req);
  }

  private run(req: Request) {
    return this.stack(req);
  }
}
