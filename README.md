# `fetch-run`

Fetch middleware for the modern minimalist.

A TypeScript wrapper around [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) with composable middleware.

`Api` serializes request bodies as JSON and resolves with parsed JSON. [`Http`](#http) exposes the same request API and resolves with the raw `Response`.

## Install

```sh
npm install fetch-run
```

## Quick start

The following example configures an `Api` instance with logging and HTTP error handling, then performs a typed request.

```ts
import { Api, HTTPError } from 'fetch-run';
import { error, logger } from 'fetch-run/use';

const api = Api.create('https://example.com/api');

// Register response observers before `error`.
api.use(logger);
api.use(error);

type User = { id: number; name: string };

async function loadUser() {
  try {
    return await api.get<User>('users/42');
  } catch (err) {
    if (err instanceof HTTPError) {
      console.error(err.code, await err.response.json());
      return;
    }

    throw err;
  }
}
```

`Api.create()` sets `Accept: application/json` and `Content-Type: application/json` headers. `RequestInit` options can be supplied when creating an instance and for individual requests.

## Middleware

A middleware receives a `Request` before it reaches `fetch` and receives its `Response` after the request completes. It can modify either value.

```ts
import type { Layer, Middleware } from 'fetch-run';

const timing: Middleware = (next: Layer) => async (request: Request) => {
  const startedAt = performance.now();
  const response = await next(request);

  console.log(`${request.method} took ${performance.now() - startedAt}ms`);

  return response;
};

api.use(timing);
```

Middleware is composed in last-in, first-out order. Given:

```ts
api.use(A);
api.use(B);
```

the execution sequence is `B before → A before → fetch → A after → B after`.

The bundled `error` middleware throws for unsuccessful HTTP responses. Middleware that must observe the response, such as `logger`, must be registered before `error`.

## API

All `Api` request methods resolve with parsed JSON.

| Method | Description |
| --- | --- |
| `get<Res>(path, options?)` | Executes a `GET` request. |
| `search<Res>(path, query, options?)` | Executes a `GET` request with a `URLSearchParams` query. |
| `post<Res, Req>(path, data?, options?)` | Executes a `POST` request. |
| `put<Res, Req>(path, data?, options?)` | Executes a `PUT` request. |
| `patch<Res, Req>(path, data?, options?)` | Executes a `PATCH` request. |
| `delete<Res>(path, options?)` | Executes a `DELETE` request. |

`Req` accepts an object, `FormData`, or no value. Objects are JSON encoded. `FormData` is passed through unchanged and removes the JSON `Content-Type` header so the browser can set the multipart boundary.

### Configuration

```ts
const api = Api.create('https://example.com/api', {
  credentials: 'include',
});

api.setHeader('X-Client-Version', '3');
api.setBearer(accessToken);

const unsubscribe = api.subscribe((request, response) => {
  if (!response.ok) {
    console.error(request.method, response.status, response.data);
  }
});

unsubscribe();
```

`setBearer(null)` removes the `Authorization` header. The `subscribe()` callback receives the request and a `ResponseParsed` object. `ResponseParsed.data` contains the parsed JSON body or `null`; the remaining properties are `headers`, `ok`, `status`, `statusText`, `type`, and `url`.

When the `error` middleware throws an `HTTPError`, subscribers receive the corresponding `ResponseParsed` object before the request is rethrown. The callback does not receive the `HTTPError` instance.

## Included middleware

### `error`

[`error`](./src/use/error.ts) throws an `HTTPError` when `response.ok` is false. `HTTPError` exposes:

- `code` — the HTTP status code
- `request` — the originating `Request`
- `response` — the server `Response`

```ts
import { error } from 'fetch-run/use';

api.use(error);
```

### `logger`

[`logger`](./src/use/logger.ts) writes request and response information to the console. JSON request and response bodies are included when available. It is intended for development use.

```ts
import { logger } from 'fetch-run/use';

api.use(logger);
```

Register it before `error` so failed responses are logged.

### `xsrf`

[`xsrf`](./src/use/xsrf.ts) reads the browser's `XSRF-TOKEN` cookie and sets the `X-XSRF-TOKEN` request header. It supports [Laravel Sanctum](https://laravel.com/docs/sanctum#csrf-protection) CSRF protection.

```ts
import { xsrf } from 'fetch-run/use';

api.use(xsrf);
```

## `Http`

`Http` exposes the same request and middleware APIs as `Api`, but leaves response parsing to the caller. It is suitable for downloads, blobs, streams, file uploads, and endpoints that do not return JSON.

```ts
import { Http } from 'fetch-run';

const http = Http.create('https://example.com');
const response = await http.get('manual.pdf');
const file = await response.blob();
```
