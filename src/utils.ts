export function toJSON<T>(res: Response) {
  let data: Promise<any>;

  if (res.status === 204) {
    data = Promise.resolve();
  } else {
    data = res.json();
  }

  return data as Promise<T>;
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
