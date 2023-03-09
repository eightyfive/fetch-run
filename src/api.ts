import merge from 'lodash.merge';

import { Http } from './http';
import { Resource } from './resource';
import { BodyData, IApi } from './types';
import { toJSON } from './utils';

const defaultOptions = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

export class Api extends Http implements IApi {
  public get<Res>(path: string, options?: RequestInit) {
    return super.get(path, options).then((res) => toJSON<Res>(res));
  }

  public post<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super.post<Req>(path, data, options).then((res) => toJSON<Res>(res));
  }

  public put<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super.put<Req>(path, data, options).then((res) => toJSON<Res>(res));
  }

  public patch<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ) {
    return super
      .patch<Req>(path, data, options)
      .then((res) => toJSON<Res>(res));
  }

  public delete<Res>(path: string, options?: RequestInit) {
    return super.delete(path, options).then((res) => toJSON<Res>(res));
  }

  public search<Res>(path: string, query: object, options?: RequestInit) {
    return super.search(path, query, options).then((res) => toJSON<Res>(res));
  }

  public resource<T extends object, TItem = T>(endpoint: string) {
    return new Resource<T, TItem>(this, endpoint);
  }

  public static create(url?: string, options?: RequestInit) {
    return new Api(url ?? '', merge({}, defaultOptions, options));
  }
}
