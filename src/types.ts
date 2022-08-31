export type Layer = (req: Request) => Promise<Response>;

export type Middleware = (next: Layer) => Layer;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BodyData = FormData | object;
