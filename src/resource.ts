import { Api } from './api';
import { BodyData } from './types';

type ID = string | number;

export class Resource<T extends object> {
  private api: Api;
  public endpoint: string;

  constructor(api: Api, endpoint: string) {
    this.api = api;
    this.endpoint = endpoint;
  }

  // CRUDL

  // C
  public create<Req extends BodyData = Omit<T, 'id'>>(data: Req) {
    return this.api.post<T | void, Req>(this.endpoint, data);
  }

  // R
  public read(id: ID) {
    return this.api.get<T>(`${this.endpoint}/${id}`);
  }

  // U
  public update<Req extends BodyData = Omit<T, 'id'>>(id: ID, data: Req) {
    return this.api.put<T | void, Req>(`${this.endpoint}/${id}`, data);
  }

  // D
  public delete<Res = void>(id: ID) {
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
