import qs from 'query-string';

import { BodyData, Layer, Method, Middleware } from './types';

type HttpOptions = Omit<RequestInit, 'headers'> & {
  headers: Headers;
};

type ErrorHandler = (err: unknown) => void;

type Listener = (req: Request, res: Response) => void;

export class Http {
  public readonly baseUrl: string;
  public readonly options: HttpOptions;

  protected errorHandlers: Set<ErrorHandler> = new Set();
  protected listeners: Set<Listener> = new Set();
  protected stack: Layer;

  constructor(baseUrl: string, options?: RequestInit, stack?: Layer) {
    this.baseUrl = baseUrl;

    this.options = Object.assign({}, options, {
      headers: new Headers(options?.headers),
    });

    if (stack) {
      this.stack = stack.bind(this);
    } else {
      this.stack = (req: Request) => fetch(req);
    }
  }

  public use(middleware: Middleware) {
    this.stack = middleware(this.stack);
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);

    // Unsubscribe
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onError(handler: ErrorHandler) {
    this.errorHandlers.add(handler);

    // Unsubscribe
    return () => {
      this.errorHandlers.delete(handler);
    };
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
    try {
      const res = await this.run(req);

      this.emit(req, res.clone());

      return res;
    } catch (err) {
      this.handleError(err);

      throw err;
    }
  }

  protected emit(req: Request, res: Response) {
    this.listeners.forEach((listener) => {
      listener(req, res);
    });
  }

  protected handleError(err: unknown) {
    this.errorHandlers.forEach((handler) => {
      handler(err);
    });
  }

  protected run(req: Request) {
    return this.stack(req);
  }

  public clone(pathname: string = '') {
    // @ts-ignore
    return new this.constructor(
      pathname ? `${this.baseUrl}/${pathname}` : this.baseUrl,
      { ...this.options },
      this.stack,
    );
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

  public static create(url?: string, options?: RequestInit) {
    return new Http(url ?? '', options);
  }
}
