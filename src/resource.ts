import { IApi, ResourceData, ResourceId, ResourceParams } from './types';
import { parseParams, replaceParams } from './utils';

export class Resource<
  T extends object,
  TItem = T,
  idAttribute extends string = 'id',
> {
  protected api: IApi;

  public path: string;
  public paramNames: string[];

  constructor(api: IApi, path: string) {
    this.api = api;

    this.path = path;
    this.paramNames = parseParams(path);

    if (this.paramNames.some((name) => name === 'id')) {
      throw new Error('":id" is a reserved param name');
    }
  }

  public match(pathname: string) {
    return (
      this.matchPath(pathname, `${this.path}/:id`) ||
      this.matchPath(pathname, this.path)
    );
  }

  protected matchPath(pathname: string, path: string) {
    const urlSegments = pathname.substring(1).split('/');

    const pathSegments = path.split('/');

    if (urlSegments.length === pathSegments.length) {
      let index = 0;
      let paramIndex = 0;

      const params: Record<string, string> = {};

      for (const urlSegment of urlSegments) {
        const pathSegment = pathSegments[index];

        if (pathSegment.startsWith(':')) {
          const paramName = this.paramNames[paramIndex] ?? 'id';

          if (!paramName) {
            return null;
          }

          paramIndex++;

          params[paramName] = urlSegment;
        } else if (urlSegment !== pathSegment) {
          return null;
        }

        index++;
      }

      return params;
    }

    return null;
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

  protected buildUrl(params?: ResourceParams, id?: ResourceId) {
    const paramNames = Object.keys(params ?? []).filter((param) =>
      this.paramNames.includes(param),
    );

    if (paramNames.length !== this.paramNames.length) {
      throw new Error(
        `Missing params "${this.path}": [${this.paramNames
          .filter((name) => !paramNames.includes(name))
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
