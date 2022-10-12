import qs from 'query-string';

import { HttpBase } from './http-base';
import { Layer } from './types';
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
  public endpoints: string[];

  constructor(
    endpoints: string[],
    baseUrl: string,
    options?: RequestInit,
    stack?: Layer,
  ) {
    super(baseUrl, options, stack);

    // @ts-ignore
    this.endpoint = endpoints.pop();
    this.endpoints = endpoints;
  }

  // CRUDLS

  // - Create
  // - Read
  // - Update
  // - Delete
  // - List
  // - Search

  // C
  public create<Res = T, Req extends object = ResourceData<T, idAttribute>>(
    data: Req,
    ...ids: ResourceId[]
  ) {
    return this.request('POST', this.getUrl(ids), data).then((res) =>
      toJSON<Res>(res),
    );
  }

  // R
  public read<T>(id: ResourceId, ...ids: ResourceId[]) {
    return this.request('GET', this.getUrl(ids, id)).then((res) =>
      toJSON<T>(res),
    );
  }

  // U
  public update<Res = T, Req extends object = ResourceData<T, idAttribute>>(
    id: ResourceId,
    data: Req,
    ...ids: ResourceId[]
  ) {
    return this.request('PUT', this.getUrl(ids, id), data).then((res) =>
      toJSON<Res>(res),
    );
  }

  // D
  public delete<Res = void>(id: ResourceId, ...ids: ResourceId[]) {
    return this.request('DELETE', this.getUrl(ids, id)).then((res) =>
      toJSON<Res>(res),
    );
  }

  // L
  public list(...ids: ResourceId[]) {
    return this.request('GET', this.getUrl(ids)).then((res) =>
      toJSON<T[]>(res),
    );
  }

  // Search
  public search(query: object, ...ids: ResourceId[]) {
    return this.request(
      'GET',
      `${this.getUrl(ids)}?${qs.stringify(query)}`,
    ).then((res) => toJSON<T[]>(res));
  }

  protected getUrl(ids: ResourceId[], id?: ResourceId) {
    let url = `${this.getBaseUrl(ids)}/${this.endpoint}`;

    if (!id) {
      return url;
    }

    return `${url}/${id}`;
  }

  protected getBaseUrl(parents: ResourceId[]) {
    const ids = Array.from(parents).reverse();

    return this.endpoints
      .map((endpoint, index) => `${endpoint}/${ids[index]}`)
      .join('/');
  }

  public resource<R extends object>(endpoint: string) {
    return new Resource<R>(
      [...this.endpoints, this.endpoint, endpoint],
      this.baseUrl,
      this.options,
      this.stack,
    );
  }
}
