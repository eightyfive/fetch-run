import { Api } from './api';
import { BodyData } from './types';

export type ResourceId = string | number;

export type ResourceData<
  T extends object,
  idAttribute extends string = 'id',
> = Omit<T, idAttribute>;

export class Resource<T extends object, idAttribute extends string = 'id'> {
  private api: Api;
  public endpoint: string;

  constructor(api: Api, endpoint: string) {
    this.api = api;
    this.endpoint = endpoint;
  }

  // CRUDL

  // C
  public create<Req extends BodyData = ResourceData<T, idAttribute>>(
    data: Req,
  ) {
    return this.api.post<T | void, Req>(this.endpoint, data);
  }

  // R
  public read(id: ResourceId) {
    return this.api.get<T>(`${this.endpoint}/${id}`);
  }

  // U
  public update<Req extends BodyData = ResourceData<T, idAttribute>>(
    id: ResourceId,
    data: Req,
  ) {
    return this.api.put<T | void, Req>(`${this.endpoint}/${id}`, data);
  }

  // D
  public delete<Res = void>(id: ResourceId) {
    return this.api.delete<Res>(`${this.endpoint}/${id}`);
  }

  // L
  public list(query?: object) {
    if (query) {
      return this.api.search<T[]>(this.endpoint, query);
    }

    return this.api.get<T[]>(this.endpoint);
  }
}
