import qs from 'query-string';

import { BodyData, Layer, Method, Middleware } from './types';

type HttpOptions = Omit<RequestInit, 'headers'> & {
  headers: Headers;
};

export class Http {
  public readonly baseUrl: string;
  public readonly options: HttpOptions;

  protected stack: Layer;

  constructor(baseUrl: string, options?: RequestInit) {
    this.baseUrl = baseUrl;

    this.options = Object.assign({}, options, {
      headers: new Headers(options?.headers),
    });

    this.stack = (req: Request) => fetch(req);
  }

  public use(middleware: Middleware) {
    this.stack = middleware(this.stack);
  }

  public setHeader(name: string, value: string) {
    this.options.headers.set(name, value);
  }

  public setBearer(token: string) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  protected createHeaders(init?: HeadersInit) {
    const headers = new Headers(this.options.headers);

    Object.entries(init ?? {}).forEach(([name, value]) => {
      headers.set(name, value);
    });

    return headers;
  }

  protected async request(
    method: Method,
    path: string,
    data: BodyData,
    options?: RequestInit,
  ) {
    // Init
    const init: HttpOptions = Object.assign({}, this.options, options, {
      headers: this.createHeaders(options?.headers),
      method,
    });

    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        init.body = data;
        init.headers.delete('Content-Type');
      } else {
        init.body = JSON.stringify(data, null, 2);
      }
    }

    // Request
    const req = new Request(`${this.baseUrl}/${path}`, init);

    // Response
    return this.run(req);
  }

  protected run(req: Request) {
    return this.stack(req);
  }

  public get(path: string, options?: RequestInit) {
    return this.request('GET', path, undefined, options);
  }

  public post<Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return this.request('POST', path, data, options);
  }

  public put<Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return this.request('PUT', path, data, options);
  }

  public patch<Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return this.request('PATCH', path, data, options);
  }

  public delete(path: string, options?: RequestInit) {
    return this.request('DELETE', path, undefined, options);
  }

  public search(path: string, query: object, options?: RequestInit) {
    return this.request(
      'GET',
      `${path}?${qs.stringify(query)}`,
      undefined,
      options,
    );
  }

  public static create(url: string, options?: RequestInit) {
    return new Http(url, options);
  }
}
