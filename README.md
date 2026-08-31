# `fetch-run`

A small TypeScript wrapper around [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) with composable middleware.

Use `Api` for JSON APIs—the default for most applications. It serializes request bodies as JSON and resolves requests with parsed JSON. Use [`Http`](#http) only when you need the raw `Response`.

## Install

```sh
yarn add fetch-run
```

## Quick start

Create an `Api`, register any middleware, and make typed JSON requests.

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

`Api.create()` includes `Accept: application/json` and `Content-Type: application/json` headers. Pass `RequestInit` options when creating the API or making an individual request.

## Middleware

Middleware wraps every request. It can inspect or change the `Request` before `fetch`, then inspect or change the `Response` after it.

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

Middleware runs in last-in, first-out order. With:

```ts
api.use(A);
api.use(B);
```

the request flows as `B before → A before → fetch → A after → B after`.

The bundled `error` middleware throws for unsuccessful HTTP responses. Register middleware that must observe a response, such as `logger`, before `error`.

## API

All `Api` request methods resolve with parsed JSON.

| Method | Description |
| --- | --- |
| `get<Res>(path, options?)` | Make a `GET` request. |
| `search<Res>(path, query, options?)` | Make a `GET` request with a `URLSearchParams` query. |
| `post<Res, Req>(path, data?, options?)` | Make a `POST` request. |
| `put<Res, Req>(path, data?, options?)` | Make a `PUT` request. |
| `patch<Res, Req>(path, data?, options?)` | Make a `PATCH` request. |
| `delete<Res>(path, options?)` | Make a `DELETE` request. |

`Req` can be an object, `FormData`, or omitted. Objects are JSON encoded. For `FormData`, `fetch-run` passes the data through and removes the JSON `Content-Type` header so the browser can set the multipart boundary.

### Configuration

```ts
const api = Api.create('https://example.com/api', {
  credentials: 'include',
});

api.setHeader('X-Client-Version', '3');
api.setBearer(accessToken);

const unsubscribe = api.subscribe((request, response) => {
  console.log(request.method, response.status);
});

unsubscribe();
```

Use `setBearer(null)` to remove the `Authorization` header. `subscribe()` receives each request plus a parsed clone of its response, including responses captured by the `error` middleware.

## Included middleware

### `error`

[`error`](./src/use/error.ts) throws an `HTTPError` when `response.ok` is false. The error exposes:

- `code` — the HTTP status code
- `request` — the originating `Request`
- `response` — the server `Response`

```ts
import { error } from 'fetch-run/use';

api.use(error);
```

### `logger`

[`logger`](./src/use/logger.ts) logs each request and response to the console, including JSON request and response bodies when available. It is intended for development.

```ts
import { logger } from 'fetch-run/use';

api.use(logger); // Enable in development.
```

Register it before `error` so failed responses are logged.

### `xsrf`

[`xsrf`](./src/use/xsrf.ts) reads the browser's `XSRF-TOKEN` cookie and sets the `X-XSRF-TOKEN` request header. It is useful with [Laravel Sanctum](https://laravel.com/docs/sanctum#csrf-protection).

```ts
import { xsrf } from 'fetch-run/use';

api.use(xsrf);
```

## `Http`

`Http` has the same request and middleware APIs as `Api`, but resolves with the raw [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) instead of parsing JSON. Choose it for downloads, blobs, streams, file uploads, or any endpoint that does not return JSON.

```ts
import { Http } from 'fetch-run';

const http = Http.create('https://example.com');
const response = await http.get('manual.pdf');
const file = await response.blob();
```
