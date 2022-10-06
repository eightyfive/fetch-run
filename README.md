# `fetch-run`

Fetch middleware for the modern minimalist.

## Install

```
yarn add fetch-run
```

## Usage

```ts
import { Api } from 'fetch-run';
import * as uses from 'fetch-run/use';

const api = Api.create('https://example.org/api/v1');

if (__DEV__) {
  api.use(uses.logger);
}

api.use(uses.error);

// Later in app
type LoginRes = { token: string };
type LoginReq = { email: string; password };
type User = { id: number; name: string };

api.post<LoginRes, LoginReq>('login', data);

api.get<User>(`users/${id}`).then((user) => {});

api.search<User[]>('users', { firstName: 'John' }).then((users) => {});
```

## Middlewares

A simple implementation of the middleware pattern. It allows you to modify the [Request object](https://developer.mozilla.org/en-US/docs/Web/API/Request) before your API call and use the [Response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) right after receiving the response from the server.

Here are some examples/implementations of the middleware pattern:

- [Using Express middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Middleware - Laravel](https://laravel.com/docs/5.7/middleware)
- [Middleware - Redux](https://redux.js.org/advanced/middleware)

A good way to visualize the middleware pattern is to think of the Request/Response lifecycle [as an onion](https://www.google.com/search?q=middleware+onion&tbm=isch). Every middleware added to the stack being a new onion layer on top of the previous one.

Every middleware takes a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) in and _must_ give a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) out.

```ts
type Layer = (req: Request) => Promise<Response>;

type Middleware = (next: Layer) => Layer;

// src/http/my-middleware.ts

export const myMiddleware: Middleware =
  (next: Layer) => async (req: Request) => {
    // Before

    const res: Response = await next(req);

    // After

    return res; // Response
  };
```

### "Before/After" concept

Let's write a simple middleware that remembers an "access token" and sets a "Bearer header" on the next [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) once available.

```js
// src/http/access-token.js

let accessToken;

export default (next) => async (req) => {
  //
  // BEFORE
  // Modify/Use Request
  //

  if (accessToken) {
    req.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await next(req);

  //
  // AFTER
  // Modify/Use Response
  //

  if (res.access_token) {
    accessToken = res.access_token;
  }

  return res;
};
```

### Execution order (LIFO)

Since everything is a middleware, the _order of execution_ is important.

Middlewares are executed in [LIFO order](https://en.wikipedia.org/wiki/FIFO_and_LIFO_accounting#LIFO) ("Last In, First Out").

Everytime you push a new middleware to the stack, it is added as a new [onion layer](https://www.google.com/search?q=middleware+onion&tbm=isch) on top of all existing ones.

#### Example

```js
api.use(A);
api.use(B);
```

Execution order:

1. `B` "Before" logic
2. `A` "Before" logic
3. (actual `fetch` call)
4. `A` "After" logic
5. `B` "After" logic

_Note_: `B` is the most outer layer of the [onion](https://www.google.com/search?q=middleware+onion&tbm=isch).

## `Http` flavour

The library also exports an `Http` flavour that does not transform the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) to JSON.

```ts
import { Http } from 'fetch-run';

const http = new Http('https://example.org');

http.use(error);

http.get('index.html').then((res: Response) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Response
  res.blob();
  res.formData();
  res.json();
  res.text();
  // ...
});
```

## API

### `constructor(baseUrl: string, defaultOptions?: RequestInit)`

Creates a new instance of `Api` or `Http`.

```ts
const api = new Api('', { credentials: 'include' });

const http = new Http('https://example.org', {
  mode: 'no-cors',
  headers: { 'X-Foo': 'Bar' },
});
```

### `static create(baseUrl?: string, defaultOptions?: RequestInit)`

Alternative & convenient way for creating an instance.

```ts
const api = Api.create('', { credentials: 'include' });

const http = Http.create('https://example.org', {
  mode: 'no-cors',
  headers: { 'X-Foo': 'Bar' },
});
```

#### Note

`Api.create` will add the following default headers:

```json
{
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

`new Api`, `new Http` & `Http.create` do not.

### `use(middleware: Middleware)`

Adds a middleware to the stack. See [Middlewares](https://github.com/eightyfive/fetch-run#middlewares) and [Execution order (LIFO)](https://github.com/eightyfive/fetch-run#execution-order-lifo) for more information.

```ts
type Layer = (req: Request) => Promise<Response>;
type Middleware = (next: Layer) => Layer;
```

### `get<Res>(path: string, options?: RequestInit)`

Performs a `GET` request. If you need to pass query parameters to the URL, use `search` instead.

### `search<Res>(path: string, query: object, options?: RequestInit)`

Performs a `GET` request with additional query parameters passed in URL.

### `post<Res, Req extends BodyData>(path: string, data?: Req, options?: RequestInit)`

Performs a `POST` request.

```ts
type BodyData = FormData | object | void;
```

### `put<Res, Req extends BodyData>(path: string, data?: Req, options?: RequestInit)`

Performs a `PUT` request.

### `patch<Res, Req extends BodyData>(path: string, data?: Req, options?: RequestInit)`

Performs a `PATCH` request.

### `delete(path: string, options?: RequestInit)`

Performs a `DELETE` request.

### `options?: RequestInit`

All `options` are merged with the default options (`constructor`) and passed down to the [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.

## Included middleware

### HTTP Error

- Catch HTTP responses with error status code (`< 200 || >= 300` – a.k.a. [`response.ok`](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok))
- Create a custom [`err: HTTPError`](https://github.com/eightyfive/fetch-run/blob/master/src/error.ts)
- Set `err.code = res.status`
- Set `err.message = res.statusText`
- Set `err.request = req`
- Set `err.response = res`
- Throw `HTTPError`

```js
import { error } from 'fetch-run/use';

api.use(error);
```

Later in app:

```js
import { HTTPError } from 'fetch-run';

try {
  api.updateUser(123, { name: 'Tyron' });
} catch (err) {
  if (err instanceof HTTPError) {
    err.response.json(); //...
  } else {
    throw err;
  }
}
```

#### Note (order of execution)

All middlewares registered _after_ the `error` middleware, will not be executed.

This is why, for example, you need to register the `logger` middleware first, so it can log `req` & `res` before the error is thrown.

### HTTP Error (Metro bundler)

The Metro bundler (React Native) fails with `ENOENT` error when throwing a [custom `Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types):

```
Error: ENOENT: no such file or directory, open '<app-root>/HTTPError@http:/127.0.0.1:19000/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false'
```

This is why we need to throw a "normal" `Error` and unfortunately not the custom `HTTPError` itself (yet?).

This prevents the use of `instanceof HTTPError` + forces to [assert the type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) when using Typescript:

```ts
import { HTTPError } from 'fetch-run';

try {
  // ...
} catch (err: Error) {
  // if (err instanceof HTTPError) // Cannot...
  if (err.name === 'HTTPError') {
    (err as HTTPError).response.json(); // ...
  }
}
```

See [source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/error-metro.ts) for more details.

```js
import { errorMetro } from 'fetch-run/use';

api.use(errorMetro);
```

### Log requests & responses (DEV)

- Log `Request`
- Log `Response`
- Log `>= 300` error (trace, message...)

```js
import { logger } from 'fetch-run/use';

if (__DEV__) {
  api.use(logger);
}
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/logger.ts)

### `XSRF-TOKEN` cookie (CSRF)

For example when used with [Laravel Sanctum](https://laravel.com/docs/9.x/sanctum#csrf-protection).

- Get `XSRF-TOKEN` cookie value
- Set `X-XSRF-TOKEN` header

```js
import { xsrf } from 'fetch-run/use';

api.use(xsrf);
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/xsrf.ts)
