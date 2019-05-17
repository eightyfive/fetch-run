# `fetch-run`

`fetch-run` is a small utility `class` that helps you deal with your API endpoints.

- Run your API calls through a middleware stack
- Common use cases / middlewares included (convert to json, normalize response, throw error...)

## Install

```
$ yarn add fetch-run
```

## Usage

```js
// <your-app>/src/services/api.js
import Http from 'fetch-run';
import { normalize } from 'normalizr';

export default class Api extends Http {
  login(data) {
    return this.post('login', data);
  }

  getMessages(chatId) {
    return this.get(`chats/${chatId}/messages`).then(json =>
      normalize(json, [this.schemas.message])
    );
  }

  updateUser(userId, data) {
    return this.put(`users/${userId}`, data).then(json =>
      normalize(json, this.schemas.user)
    );
  }

  // ...
}
```

Later in app:

```js
import { schema } from 'normalizr';
import jsonResponse from 'fetch-run/use/json';

import Api from '<your-app>/src/services/api.js';

let baseUri;

if (__DEV__) {
  baseUri = "http://localhost/api/v1";
} else {
  baseUri = "https://example.org/api/v1";
}

const api = new Api(baseUri);

api.schemas = {
  user: new schema.Entity('users'),
  message: new schema.Entity('messages'),
};

api.use(jsonResponse);
api.use(...);
// ...

export default api;
```

## Middlewares

A simple implementation of the middleware pattern. It allows you to modify the [Request object](https://developer.mozilla.org/en-US/docs/Web/API/Request) before your API call and use the [Response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) right after receiving the response from the server.

Here is more information about the middleware pattern:

- [Using Express middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Middleware - Laravel](https://laravel.com/docs/5.7/middleware)
- [Middleware - Redux](https://redux.js.org/advanced/middleware)

A good way to visualize the middleware pattern is to think of the Request/Response lifecycle [as an onion](https://www.google.com/search?q=middleware+onion&tbm=isch). Every middleware added being a new onion layer on top of the previous one.

### Everything is a middleware

For example `fetch-run` does not assume that you want to convert your API responses to `json`. In order to do so, you have to _explicitly_ include the appropriate middleware:

```js
import jsonResponse from 'fetch-run/use/json';
// ...

const api = new Api(baseUri);

api.use(jsonResponse);
```

Since everything is a middleware, the [order of execution](https://github.com/eightyfive/fetch-run#execution-order-lifo) is important.

### Before/After

`fetch-run` uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) Web APIs standards:

- [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers)

Let's write a simple middleware that remembers an "Access Token" and sets it automatically on the Request once available.

```js
// <your-app>/src/http/access-token.js

let accessToken;

export default next => async req => {
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

Middlewares are executed in [LIFO order](https://en.wikipedia.org/wiki/FIFO_and_LIFO_accounting#LIFO) ("Last In, First Out").

Everytime you push a new middleware to the stack, it is added as a new [onion layer](https://www.google.com/search?q=middleware+onion&tbm=isch) on top of all existing ones.

#### Simple example

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

## `Http` API

`use(middleware)`

Adds a middleware to the stack. See [Middlewares](https://github.com/eightyfive/fetch-run#middlewares) and [Execution order (LIFO)](https://github.com/eightyfive/fetch-run#execution-order-lifo) for more information.

`get(pathname, options = {})`

Performs a `GET` request. If you need to pass query parameters to the URL, use `search` instead.

`search(pathname, data, options = {})`

Performs a `GET` request with additional query parameters passed in URL.

`post(pathname, data = {}, options = {})`

Performs a `POST` request.

`put(pathname, data = {}, options = {})`

Performs a `PUT` request.

`patch(pathname, data = {}, options = {})`

Performs a `PATCH` request.

`delete(pathname, options = {})`

Performs a `DELETE` request.

### `options`

All `options` are passed down to the [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.

## Included middlewares

### Json response

- Convert response to JSON

```js
import jsonResponse from 'fetch-run/use/json';

api.use(jsonResponse);
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/use/json.js)

### HTTP Error

- Catch HTTP responses with error status code (`< 200 || >= 300`)
- Create a custom [`HttpError`](https://github.com/eightyfive/fetch-run/blob/master/http-error.js)
- Set `err.response = res`
- Set `err.data = res.json()`
- Throw `HttpError`

```js
import error from 'fetch-run/use/error';

api.use(error);
```

Later in app:

```js
import HttpError from 'fetch-run/http-error';

try {
  api.updateUser(123, { name: 'Tyron' });
} catch (err) {
  if (err instanceof HttpError) {
    // err.response
    // err.data (JSON data of error response)
  } else {
    throw err;
  }
}
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/use/error.js)

### Log requests (DEV)

- Log `Request`
- Log `Response`
- Log `>= 500` error (trace, message...)

```js
import logger from 'fetch-run/use/logger';

if (__DEV__) {
  api.use(logger);
}
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/use/logger.js)

## Polyfill

`fetch-run` requires the [fetch](https://github.com/github/fetch) polyfill when applicable.

```js
$ yarn add whatwg-fetch

// <your-app>/src/services/api.js
import "whatwg-fetch";
// ...
```
