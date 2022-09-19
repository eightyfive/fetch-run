import merge from 'lodash.merge';

import { Http } from './http';
import { BodyData } from './types';

const defaultOptions = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

function transform(res: Response) {
  if (res.status === 204) {
    return Promise.resolve();
  }

  return res.json();
}

export class Api extends Http {
  public get<Res>(path: string, options?: RequestInit) {
    return super
      .get(path, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public post<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super
      .post(path, data, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public put<Res, Req extends object>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super
      .put(path, data, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public patch<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super
      .patch(path, data, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public delete<Res>(path: string, options?: RequestInit) {
    return super
      .delete(path, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public search<Res>(path: string, query: object, options?: RequestInit) {
    return super
      .search(path, query, options)
      .then((res) => transform(res)) as Promise<Res>;
  }

  public static create(url?: string, options?: RequestInit) {
    return new Api(url || '', merge({}, defaultOptions, options));
  }
}
