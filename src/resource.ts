import qs from 'query-string';

import { HttpBase } from './http-base';
import { toJSON } from './utils';

export type ResourceId = string | number;

export type ResourceData<
  T extends object,
  idAttribute extends string = 'id',
> = Omit<T, idAttribute>;

export class Resource<
  T extends object,
  idAttribute extends string = 'id',
> extends HttpBase {
  public endpoint: string;

  constructor(endpoint: string, baseUrl: string, options?: RequestInit) {
    super(baseUrl, options);

    this.endpoint = endpoint;
  }

  // CRUDL

  // C
  public create<Res = T, Req extends object = ResourceData<T, idAttribute>>(
    data: Req,
  ) {
    return this.request('POST', this.endpoint, data).then((res) =>
      toJSON<Res>(res),
    );
  }

  // R
  public read<T>(id: ResourceId) {
    return this.request('GET', `${this.endpoint}/${id}`).then((res) =>
      toJSON<T>(res),
    );
  }

  // U
  public update<Res = T, Req extends object = ResourceData<T, idAttribute>>(
    id: ResourceId,
    data: Req,
  ) {
    return this.request('PUT', `${this.endpoint}/${id}`, data).then((res) =>
      toJSON<Res>(res),
    );
  }

  // D
  public delete<Res = void>(id: ResourceId) {
    return this.request('DELETE', `${this.endpoint}/${id}`).then((res) =>
      toJSON<Res>(res),
    );
  }

  // L
  public list(query?: object) {
    let path = this.endpoint;

    if (query) {
      path += `?${qs.stringify(query)}`;
    }

    return this.request('GET', path).then((res) => toJSON<T[]>(res));
  }
}
