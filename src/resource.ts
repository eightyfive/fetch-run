import { IApi, ResourceData, ResourceId, ExtractRouteParams } from './types';
import { parseRoute, buildRoute } from './utils';

export class Resource<
  T extends object,
  TItem = T,
  R extends string = string,
  idAttribute extends string = 'id',
> {
  protected api: IApi;

  public route: R;

  constructor(api: IApi, route: R) {
    this.api = api;

    this.route = route;

    const routeParamNames = parseRoute(route);

    if (routeParamNames.some((name) => name === 'id')) {
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
  >(req: Req, routeParams?: ExtractRouteParams<R>) {
    return this.api.post<Res, Req>(this.buildPath(routeParams), req);
  }

  // R
  public read<Res = T>(id: ResourceId, routeParams?: ExtractRouteParams<R>) {
    return this.api.get<Res>(this.buildPath(routeParams, id));
  }

  // U
  public update<
    Res extends T | void = T,
    Req extends object | void = ResourceData<T, idAttribute>,
  >(id: ResourceId, req: Req, routeParams?: ExtractRouteParams<R>) {
    return this.api.put<Res, Req>(this.buildPath(routeParams, id), req);
  }

  // D
  public delete<Res extends T | void = void>(
    id: ResourceId,
    routeParams?: ExtractRouteParams<R>,
  ) {
    return this.api.delete<Res>(this.buildPath(routeParams, id));
  }

  // L
  public list<Res = TItem[]>(routeParams?: ExtractRouteParams<R>) {
    return this.api.get<Res>(this.buildPath(routeParams));
  }

  // Search
  public search<Res = T[]>(
    query: URLSearchParams,
    routeParams?: ExtractRouteParams<R>,
  ) {
    return this.api.search<Res>(this.buildPath(routeParams), query);
  }

  protected buildPath(routeParams?: ExtractRouteParams<R>, id?: ResourceId) {
    const path = routeParams ? buildRoute(this.route, routeParams) : this.route;

    if (id) {
      return `${path}/${id}`;
    }

    return path;
  }
}
