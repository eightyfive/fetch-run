export type Layer = (req: Request) => Promise<Response>;

export type Middleware = (next: Layer) => Layer;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BodyData = void | object | FormData;

export interface IApi {
  get<Res>(path: string, options?: RequestInit): Promise<Res>;

  post<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ): Promise<Res>;

  put<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ): Promise<Res>;

  patch<Res, Req extends BodyData>(
    path: string,
    data?: Req,
    options?: RequestInit,
  ): Promise<Res>;

  delete<Res>(path: string, options?: RequestInit): Promise<Res>;

  search<Res>(path: string, query: object, options?: RequestInit): Promise<Res>;
}

export type ResourceId = string | number;

export type ResourceParams = Record<string, ResourceId>;

export type ResourceData<
  T extends object,
  idAttribute extends string = 'id',
> = Omit<T, idAttribute>;
