import { ResourceParams } from './types';

export function toJSON<T>(res: Response) {
  let data: Promise<any>;

  if (res.status === 204) {
    data = Promise.resolve();
  } else {
    data = res.json();
  }

  return data as Promise<T>;
}

export function parseParams(route: string) {
  return route
    .split('/')
    .filter((segment) => segment.startsWith(':'))
    .map((param) => param.substring(1));
}

export function replaceParams(route: string, params: ResourceParams) {
  let url = route;

  for (const [name, value] of Object.entries(params)) {
    const paramName = `:${name}`;

    url = url.replace(paramName, `${value}`);
  }

  return url;
}
