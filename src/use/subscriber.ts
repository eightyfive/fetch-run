import { Layer } from '../types';

type Json = string | number | boolean | Json[] | { [key: string]: Json };

type ResponseParsed = {
  data: Json | null;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  type: ResponseType;
  url: string;
};

type Listener = (req: Request, res: ResponseParsed) => void;

async function parseResponse(response: Response): Promise<ResponseParsed> {
  const res = response.clone();
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

export function createSubscriber(listeners: Listener[]) {
  return (next: Layer) => async (request: Request) => {
    const response = await next(request);

    const res = await parseResponse(response);

    listeners.forEach((listener) => {
      listener(request, res);
    });

    return response;
  };
}
