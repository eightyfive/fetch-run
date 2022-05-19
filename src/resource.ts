import { Http, Json } from './http';

type ResourceId = string | number;

export class Resource<T, idProperty extends string = 'id'> {
  http: Http;
  endpoint: string;

  constructor(http: Http, endpoint: string) {
    this.http = http;
    this.endpoint = endpoint;
  }

  // CRUDL

  // C
  create(data: Omit<T, idProperty>) {
    return this.http.post<Omit<T, idProperty>>(this.endpoint, data);
  }

  // R
  read(id: ResourceId) {
    return this.http.get(`${this.endpoint}/${id}`);
  }

  // U
  update(id: ResourceId, data: Omit<T, idProperty>) {
    return this.http.put<Omit<T, idProperty>>(`${this.endpoint}/${id}`, data);
  }

  // D
  delete(id: ResourceId) {
    return this.http.delete(`${this.endpoint}/${id}`);
  }

  // L
  list(query?: Json) {
    if (query) {
      return this.http.search(this.endpoint, query);
    }

    return this.http.get(this.endpoint);
  }
}
