import { IApi, ResourceData, ResourceId, ResourceParams } from './types';
import { parseParams, replaceParams } from './utils';

export class Resource<
  T extends object,
  TItem = T,
  idAttribute extends string = 'id',
> {
  protected api: IApi;

  public path: string;
  public params: string[];

  constructor(api: IApi, path: string) {
    this.api = api;
    this.path = path;
    this.params = parseParams(path);
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
  >(data: Req, params?: ResourceParams) {
    return this.api.post<Res, Req>(this.buildUrl(params), data);
  }

  // R
  public read<Res = T>(id: ResourceId, params?: ResourceParams) {
    return this.api.get<Res>(this.buildUrl(params, id));
  }

  // U
  public update<
    Res = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(id: ResourceId, data: Req, params?: ResourceParams) {
    return this.api.put<Res, Req>(this.buildUrl(params, id), data);
  }

  // D
  public delete<Res = void>(id: ResourceId, params?: ResourceParams) {
    return this.api.delete<Res>(this.buildUrl(params, id));
  }

  // L
  public list<Res = TItem[]>(params?: ResourceParams) {
    return this.api.get<Res>(this.buildUrl(params));
  }

  // Search
  public search<Res = T[]>(query: object, params?: ResourceParams) {
    return this.api.search<Res>(this.buildUrl(params), query);
  }

  public isEnabled(params: ResourceParams) {
    return Object.values(params).filter(Boolean).length > 0;
  }

  protected buildUrl(params?: ResourceParams, id?: ResourceId) {
    const _params = Object.keys(params ?? []).filter((param) =>
      this.params.includes(param),
    );

    if (_params.length !== this.params.length) {
      throw new Error(
        `Missing params "${this.path}": [${this.params
          .filter((param) => !_params.includes(param))
          .join(',')}]`,
      );
    }

    const baseUrl = params ? replaceParams(this.path, params) : this.path;

    if (!id) {
      return baseUrl;
    }

    return `${baseUrl}/${id}`;
  }
}
