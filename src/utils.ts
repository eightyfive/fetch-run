import { RouteParams } from './types';

export function toJSON<T>(res: Response) {
  let data: Promise<any>;

  if (res.status === 204) {
    data = Promise.resolve();
  } else {
    data = res.json();
  }

  return data as Promise<T>;
}

export function parseRoute(route: string) {
  return route
    .split('/')
    .filter((segment) => segment.startsWith(':'))
    .map((param) => param.substring(1));
}

export function buildRoute(route: string, routeParams: RouteParams) {
  let url = route;

  for (const [name, value] of Object.entries(routeParams)) {
    const paramName = `:${name}`;

    url = url.replace(paramName, `${value}`);
  }

  return url;
}

type Json = string | number | boolean | Json[] | { [key: string]: Json };

export type ResponseParsed = {
  data: Json | null;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  type: ResponseType;
  url: string;
};

export async function parseResponse(res: Response): Promise<ResponseParsed> {
  const data: Json | null = await res.json().catch(() => null);

  return {
    data,
    headers: res.headers,
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    type: res.type,
    url: res.url,
  };
}
