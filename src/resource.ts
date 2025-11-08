import { IApi, ResourceData, ResourceId, RouteParams } from './types';
import { parseRoute, buildRoute } from './utils';

export class Resource<
  T extends object,
  TItem = T,
  idAttribute extends string = 'id',
> {
  protected api: IApi;

  public route: string;
  public routeParamNames: string[];

  constructor(api: IApi, route: string) {
    this.api = api;

    this.route = route;
    this.routeParamNames = parseRoute(route);

    if (this.routeParamNames.some((name) => name === 'id')) {
      throw new Error('":id" is a reserved route param name');
    }
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
    Res extends T | void = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(req: Req, params?: RouteParams) {
    return this.api.post<Res, Req>(this.buildPath(params), req);
  }

  // R
  public read<Res = T>(id: ResourceId, params?: RouteParams) {
    return this.api.get<Res>(this.buildPath(params, id));
  }

  // U
  public update<
    Res extends T | void = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(id: ResourceId, req: Req, params?: RouteParams) {
    return this.api.put<Res, Req>(this.buildPath(params, id), req);
  }

  // D
  public delete<Res extends T | void = void>(
    id: ResourceId,
    params?: RouteParams,
  ) {
    return this.api.delete<Res>(this.buildPath(params, id));
  }

  // L
  public list<Res = TItem[]>(params?: RouteParams) {
    return this.api.get<Res>(this.buildPath(params));
  }

  // Search
  public search<Res = T[]>(query: URLSearchParams, params?: RouteParams) {
    return this.api.search<Res>(this.buildPath(params), query);
  }

  public buildPath(params?: RouteParams, id?: ResourceId) {
    const paramNames = Object.keys(params ?? []).filter((param) =>
      this.routeParamNames.includes(param),
    );

    if (paramNames.length !== this.routeParamNames.length) {
      throw new Error(
        `Missing params "${this.route}": [${this.routeParamNames
          .filter((name) => !paramNames.includes(name))
          .join(',')}]`,
      );
    }

    const path = params ? buildRoute(this.route, params) : this.route;

    if (id) {
      return `${path}/${id}`;
    }

    return path;
  }
}
