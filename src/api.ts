import { error } from './use/error';
import { Http } from './http';
import { JSONObject } from './types';

export class Api extends Http {
  constructor(url: string, options?: RequestInit) {
    const defaultOptions = Object.assign(
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      options,
    );

    super(url, defaultOptions);

    this.use(error);
  }

  get<T>(path: string, options?: RequestInit) {
    return super.get(path, options).then((res) => res.json() as Promise<T>);
  }

  post<T, P extends JSONObject>(path: string, data: P, options?: RequestInit) {
    return super
      .post(path, data, options)
      .then((res) => res.json() as Promise<T>);
  }

  put<T, P extends JSONObject>(path: string, data: P, options?: RequestInit) {
    return super
      .put(path, data, options)
      .then((res) => res.json() as Promise<T>);
  }

  patch<T, P extends JSONObject>(path: string, data: P, options?: RequestInit) {
    return super
      .patch(path, data, options)
      .then((res) => res.json() as Promise<T>);
  }

  delete<T>(path: string, options?: RequestInit) {
    return super.delete(path, options).then((res) => res.json() as Promise<T>);
  }

  search<T>(path: string, query: JSONObject, options?: RequestInit) {
    return super
      .search(path, query, options)
      .then((res) => res.json() as Promise<T>);
  }
}
