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
  >(req: Req, routeParams?: RouteParams) {
    return this.api.post<Res, Req>(this.buildPath(routeParams), req);
  }

  // R
  public read<Res = T>(id: ResourceId, routeParams?: RouteParams) {
    return this.api.get<Res>(this.buildPath(routeParams, id));
  }

  // U
  public update<
    Res extends T | void = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(id: ResourceId, req: Req, routeParams?: RouteParams) {
    return this.api.put<Res, Req>(this.buildPath(routeParams, id), req);
  }

  // D
  public delete<Res extends T | void = void>(
    id: ResourceId,
    routeParams?: RouteParams,
  ) {
    return this.api.delete<Res>(this.buildPath(routeParams, id));
  }

  // L
  public list<Res = TItem[]>(routeParams?: RouteParams) {
    return this.api.get<Res>(this.buildPath(routeParams));
  }

  // Search
  public search<Res = T[]>(query: URLSearchParams, routeParams?: RouteParams) {
    return this.api.search<Res>(this.buildPath(routeParams), query);
  }

  public buildPath(routeParams?: RouteParams, id?: ResourceId) {
    const paramNames = Object.keys(routeParams ?? []).filter((param) =>
      this.routeParamNames.includes(param),
    );

    if (paramNames.length !== this.routeParamNames.length) {
      throw new Error(
        `Missing params "${this.route}": [${this.routeParamNames
          .filter((name) => !paramNames.includes(name))
          .join(',')}]`,
      );
    }

    const path = routeParams ? buildRoute(this.route, routeParams) : this.route;

    if (id) {
      return `${path}/${id}`;
    }

    return path;
  }
}
