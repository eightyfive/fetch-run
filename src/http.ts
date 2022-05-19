import qs from 'query-string';
import { Resource } from './resource';

export type Layer = (req: Request) => Promise<Response>;

export type Middleware = (next: Layer) => Layer;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Json {
  [x: string]: string | number | boolean | Date | Json | JsonArray;
}

interface JsonArray
  extends Array<string | number | boolean | Date | Json | JsonArray> {}

const defaultOptions = { headers: {} };

export class Http {
  public baseUrl: string;
  public options: RequestInit;
  private stack: Layer;

  constructor(url: string, options?: RequestInit) {
    this.baseUrl = url;
    this.options = Object.assign(defaultOptions, options);

    this.stack = (req: Request) => fetch(req);
  }

  public use(middleware: Middleware) {
    this.stack = middleware(this.stack);
  }

  public setHeader(name: string, value: string) {
    Object.assign(this.options.headers, { [name]: value });
  }

  public setBearer(token: string) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  public get(path: string, options?: RequestInit) {
    return this.request('GET', path, undefined, options);
  }

  public post<T = Json>(path: string, data: T, options?: RequestInit) {
    return this.request('POST', path, data, options);
  }

  public put<T = Json>(path: string, data: T, options?: RequestInit) {
    return this.request('PUT', path, data, options);
  }

  public patch<T = Json>(path: string, data: T, options?: RequestInit) {
    return this.request('PATCH', path, data, options);
  }

  public delete(path: string, options?: RequestInit) {
    return this.request('DELETE', path, undefined, options);
  }

  public search(path: string, query: Json, options?: RequestInit) {
    return this.request(
      'GET',
      `${path}?${qs.stringify(query)}`,
      undefined,
      options,
    );
  }

  public resource<T, idProperty extends string = 'id'>(endpoint: string) {
    return new Resource<T, idProperty>(this, endpoint);
  }

  private request<T>(
    method: Method,
    path: string,
    data: T | undefined,
    options?: RequestInit,
  ) {
    // Headers
    const headers: HeadersInit = Object.assign(
      {},
      this.options.headers,
      options?.headers,
    );

    // Init
    const init: RequestInit = Object.assign({}, this.options, options, {
      method,
      headers: new Headers(headers),
    });

    if (data && method !== 'GET') {
      init.body = JSON.stringify(data);
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
