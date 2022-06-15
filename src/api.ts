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

  get<Res>(path: string, options?: RequestInit) {
    return super.get(path, options).then((res) => res.json() as Promise<Res>);
  }

  post<Res, Req extends JSONObject>(
    path: string,
    data: Req,
    options?: RequestInit,
  ) {
    return super
      .post(path, data, options)
      .then((res) => res.json() as Promise<Res>);
  }

  put<Res, Req extends JSONObject>(
    path: string,
    data: Req,
    options?: RequestInit,
  ) {
    return super
      .put(path, data, options)
      .then((res) => res.json() as Promise<Res>);
  }

  patch<Res, Req extends JSONObject>(
    path: string,
    data: Req,
    options?: RequestInit,
  ) {
    return super
      .patch(path, data, options)
      .then((res) => res.json() as Promise<Res>);
  }

  delete<Res>(path: string, options?: RequestInit) {
    return super
      .delete(path, options)
      .then((res) => res.json() as Promise<Res>);
  }

  search<Res>(path: string, query: JSONObject, options?: RequestInit) {
    return super
      .search(path, query, options)
      .then((res) => res.json() as Promise<Res>);
  }
}
