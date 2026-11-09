# `fetch-run`

Fetch middleware for the modern minimalist.

A focused TypeScript wrapper around [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), built around composable middleware.

`Api` handles JSON request and response bodies. [`Http`](#http) uses the same request API while leaving the response untouched.

## Install

```sh
npm install fetch-run@next
```

## Quick start

This example configures an `Api` instance with logging and HTTP error handling, then performs a typed request.

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

`Api.create()` sets `Accept: application/json` and `Content-Type: application/json` by default. Pass `RequestInit` options when creating an instance or making an individual request.

## Middleware

Middleware runs on either side of a request: it receives the `Request` before `fetch` and the `Response` afterward. Either value can be inspected or modified.

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

Middleware executes in last-in, first-out order. Given:

```ts
api.use(A);
api.use(B);
```

the sequence is `B before → A before → fetch → A after → B after`.

The bundled `error` middleware throws for unsuccessful HTTP responses. Register middleware that needs to observe the response, such as `logger`, before `error`.

## API

All `Api` request methods resolve with parsed JSON.

| Method | Description |
| --- | --- |
| `get<Res>(path, options?)` | Sends a `GET` request. |
| `search<Res>(path, query, options?)` | Sends a `GET` request with a `URLSearchParams` query. |
| `post<Res, Req>(path, data?, options?)` | Sends a `POST` request. |
| `put<Res, Req>(path, data?, options?)` | Sends a `PUT` request. |
| `patch<Res, Req>(path, data?, options?)` | Sends a `PATCH` request. |
| `delete<Res>(path, options?)` | Sends a `DELETE` request. |

`Req` accepts an object, `FormData`, or no value. Objects are JSON encoded. `FormData` passes through unchanged and clears the JSON `Content-Type` header so the browser can set the multipart boundary.

### Configuration

```ts
const api = Api.create('https://example.com/api', {
  credentials: 'include',
});

api.setHeader('X-Client-Version', '3');
api.setBearer(accessToken);

const unsubscribe = api.subscribe((request, response, data) => {
  if (!response.ok) {
    console.error(request.method, response.status, data);
  }
});

unsubscribe();
```

`setBearer(null)` removes the `Authorization` header. `subscribe()` receives the request, the original `Response`, and the parsed JSON body (or `null` if it cannot be parsed). The response body belongs to the request caller; a subscriber that needs to read it must use `response.clone()`.

Subscriber notifications are asynchronous and do not delay or alter a request's resolved value or rejection. When `error` throws an `HTTPError`, subscribers are notified with the corresponding `Response` and parsed JSON body; the callback does not receive the `HTTPError` instance.

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

[`logger`](./src/use/logger.ts) writes request and response information to the console, including JSON bodies when available. It is intended for development use.

```ts
import { logger } from 'fetch-run/use';

api.use(logger);
```

Register it before `error` so failed responses are logged.

### `retry`

[`retry`](./src/use/retry.ts) retries transient failures with exponential backoff. Register it once to configure all requests on an `Api` or `Http` instance. Retries are opt-in; existing clients are unchanged until this middleware is registered.

```ts
import { createRetry, error, logger } from 'fetch-run/use';

api.use(logger);
api.use(createRetry({ retry: 3 }));
api.use(error);
```

This allows **three additional attempts** after the initial request, waiting **1s, 2s, then 4s**. With a larger retry budget, delays keep doubling up to a **30s cap**. For these defaults, `api.use(retry)` is also available from `fetch-run/use`.

The options follow [TanStack Query's retry configuration](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries):

| Option | Default | Description |
| --- | --- | --- |
| `retry` | `3` | Additional attempts. `false` or `0` disables retries; `true` permits unlimited retries of eligible failures; `(failureCount, error) => boolean` supplies a custom policy. |
| `retryDelay` | `count => Math.min(1000 * 2 ** count, 30000)` | A delay in milliseconds or `(failureCount, error) => milliseconds`. |
| `methods` | `['GET', 'HEAD', 'OPTIONS']` | HTTP methods eligible for retries, case-insensitive. Opt writes in only when repeating them is safe for your endpoint. |

Both callbacks receive a zero-based count: `0` before the first retry. HTTP failures are represented by `HTTPError`; other thrown values pass through unchanged. A custom `retry` predicate replaces the default failure classification and retry limit, but still respects `methods` and cancellation.

By default, retryable failures are network `TypeError`s and HTTP **408, 429, 500, 502, 503, 504**. Other failures, including ordinary 4xx responses and aborts, are not retried. Delays use the configured policy; `Retry-After` headers are not interpreted automatically.

```ts
import { HTTPError } from 'fetch-run';
import { createRetry } from 'fetch-run/use';

api.use(createRetry({
  retry: (count, error) => count < 2 && (
    error instanceof HTTPError ? error.code === 503 : error instanceof TypeError
  ),
  retryDelay: (count) => Math.min(500 * 2 ** count, 10000),
}));
```

Request bodies are cloned for each attempt. Passing an `AbortSignal` cancels both fetch and any pending retry delay. Each request has its own retry budget, including concurrent requests.

The middleware works with or without `error`, in either registration order. Without `error`, an exhausted HTTP failure resolves with the final `Response`; with it, the request rejects with the final `HTTPError`. In the example above, `logger` sees each attempt and `error` sees only the final response. Subscribers receive only the final outcome. Use a single retry middleware per client; when also using TanStack Query, enable retries in one layer to avoid multiplying attempts.

### `xsrf`

[`xsrf`](./src/use/xsrf.ts) reads the browser's `XSRF-TOKEN` cookie and sets the `X-XSRF-TOKEN` request header. It works with [Laravel Sanctum](https://laravel.com/docs/sanctum#csrf-protection) CSRF protection.

```ts
import { xsrf } from 'fetch-run/use';

api.use(xsrf);
```

## `Http`

`Http` exposes the same request and middleware APIs as `Api`, but leaves response parsing to the caller. Use it for downloads, blobs, streams, file uploads, and endpoints that do not return JSON.

```ts
import { Http } from 'fetch-run';

const http = Http.create('https://example.com');
const response = await http.get('manual.pdf');
const file = await response.blob();
```
