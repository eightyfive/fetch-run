import merge from 'lodash.merge';

import { BodyData, Layer, Method, Middleware } from './types';

const { assign } = Object;

const defaultOptions = { headers: {} };

export type HttpOptions = RequestInit & {
  headers: HeadersInit;
};

export class HttpBase {
  public baseUrl: string;
  public options: HttpOptions;
  protected stack: Layer;

  constructor(baseUrl: string, options?: RequestInit, stack?: Layer) {
    this.baseUrl = baseUrl;
    this.options = assign({}, defaultOptions, options);

    if (stack) {
      this.stack = stack.bind(this);
    } else {
      this.stack = (req: Request) => fetch(req);
    }
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

  protected request(
    method: Method,
    path: string,
    data: BodyData,
    options?: RequestInit,
  ) {
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

  protected run(req: Request) {
    return this.stack(req);
  }

  public clone() {
    // @ts-ignore
    return new this.constructor(this.baseUrl, { ...this.options }, this.stack);
  }
}
