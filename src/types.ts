export type Layer = (req: Request) => Promise<Response>;

export type Middleware = (next: Layer) => Layer;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [x: string]: JSONValue;
}

export type BodyData = FormData | JSONObject;
