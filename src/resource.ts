import { Api } from './api';
import { JSONObject } from './types';

type ResourceId = string | number;

export class Resource<T extends JSONObject, idProperty extends string = 'id'> {
  api: Api;
  endpoint: string;

  constructor(api: Api, endpoint: string) {
    this.api = api;
    this.endpoint = endpoint;
  }

  // CRUDL

  // C
  create(data: Omit<T, idProperty>) {
    return this.api.post<T, Omit<T, idProperty>>(this.endpoint, data);
  }

  // R
  read(id: ResourceId) {
    return this.api.get<T>(`${this.endpoint}/${id}`);
  }

  // U
  update(id: ResourceId, data: Omit<T, idProperty>) {
    return this.api.put<T, Omit<T, idProperty>>(`${this.endpoint}/${id}`, data);
  }

  // D
  delete(id: ResourceId) {
    return this.api.delete<T>(`${this.endpoint}/${id}`);
  }

  // L
  list(query?: JSONObject) {
    if (query) {
      return this.api.search<T[]>(this.endpoint, query);
    }

    return this.api.get<T[]>(this.endpoint);
  }
}
