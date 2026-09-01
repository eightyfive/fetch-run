export function toJSON<T>(res: Response) {
  let data: Promise<any>;

  if (res.status === 204) {
    data = Promise.resolve();
  } else {
    data = res.json();
  }

  return data as Promise<T>;
}

export type Json =
  | string
  | number
  | boolean
  | Json[]
  | { [key: string]: Json };

export async function parseResponseData(res: Response): Promise<Json | null> {
  const data: Json | null = await res.json().catch(() => null);

  return data;
}
