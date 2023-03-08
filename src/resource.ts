import { IApi } from './types';

export type ResourceId = string | number;

export type ResourceIds = (ResourceId | undefined)[];

export type ResourceData<
  T extends object,
  idAttribute extends string = 'id',
> = Omit<T, idAttribute>;

export class Resource<
  T extends object,
  TItem = T,
  idAttribute extends string = 'id',
> {
  protected api: IApi;
  protected parents: string[];

  public endpoint: string;

  constructor(api: IApi, endpoint: string, parents?: string[]) {
    this.api = api;
    this.endpoint = endpoint;
    this.parents = parents ?? [];
  }

  public get id() {
    return this.parents.length
      ? `${this.parents.join('/')}/${this.endpoint}`
      : this.endpoint;
  }

  // CRUDLS

  // - Create
  // - Read
  // - Update
  // - Delete
  // - List
  // - Search

  // C
  public create<
    Res = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(data: Req, ...parentIds: ResourceIds) {
    return this.api.post<Res, Req>(this.buildUrl(parentIds), data);
  }

  // R
  public read<Res = T>(id: ResourceId, ...parentIds: ResourceIds) {
    return this.api.get<Res>(this.buildUrl(parentIds, id));
  }

  // U
  public update<
    Res = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(id: ResourceId, data: Req, ...parentIds: ResourceIds) {
    return this.api.put<Res, Req>(this.buildUrl(parentIds, id), data);
  }

  // D
  public delete<Res = void>(id: ResourceId, ...parentIds: ResourceIds) {
    return this.api.delete<Res>(this.buildUrl(parentIds, id));
  }

  // L
  public list<Res = TItem[]>(...parentIds: ResourceIds) {
    return this.api.get<Res>(this.buildUrl(parentIds));
  }

  // Search
  public search<Res = T[]>(query: object, ...parentIds: ResourceIds) {
    return this.api.search<Res>(this.buildUrl(parentIds), query);
  }

  public getQueryKey(parentIds: ResourceIds = [], id?: ResourceId) {
    const ids = Array.from(parentIds).reverse();

    const key = this.parents
      .map((endpoint, index) => [endpoint, ids[index]])
      .flat();

    key.push(this.endpoint);

    if (id) {
      key.push(id);
    }

    return key;
  }

  protected buildUrl(parentIds: ResourceIds, id?: ResourceId) {
    let baseUrl = this.buildBaseUrl(parentIds);

    let url = baseUrl ? `${baseUrl}/${this.endpoint}` : this.endpoint;

    if (!id) {
      return url;
    }

    return `${url}/${id}`;
  }

  protected buildBaseUrl(parentIds: ResourceIds) {
    const ids = Array.from(parentIds).reverse();

    return this.parents
      .map((endpoint, index) => `${endpoint}/${ids[index]}`)
      .join('/');
  }

  public resource<R extends object>(endpoint: string) {
    return new Resource<R>(this.api, endpoint, [
      ...this.parents,
      this.endpoint,
    ]);
  }
}
