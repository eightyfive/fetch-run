# `fetch-run`

## What?

`fetch-run` is a small utility `class` that helps you deal with common use cases of targeting API endpoints.

Namely:

- Explicitly & easily define all you API endpoints
- Run your API calls through a middleware stack
- Common use cases / middlewares included (access token, refresh token, normalize response, error management...)

## Install

```
$ yarn add fetch-run
```

## Usage

```js
// <your-app>/src/services/api.js

import Http from "fetch-run";

class Api extends Http {
  login(data) {
    return this.post("login", data);
  }

  getMessages(chatId) {
    return this.get(`chats/${chatId}/messages`);
  }

  updateUser(userId, data) {
    return this.put(`users/${userId}`, data);
  }

  // ...
}

let baseUri = "https://example.org/api/v1";

if (__DEV__) {
  baseUri = "http://localhost/api/v1";
}

const api = new Api(baseUri);

api.use(/* middleware 1 */);
api.use(/* middleware 2 */);
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

For example `fetch-run` does not assume that you want to convert all your API responses to `json`. In order to do so, you have to _explicitly_ include the appropriate middleware:

```js
import { jsonResponse } from 'fetch-run';
// ...

const api = new Api(baseUri);

api.use(jsonResponse);
```

Since everything is a middleware, the [order of execution](https://github.com/eightyfive/fetch-run#execution-order-lifo) is important.

### `Request`/`Response`

`fetch-run` uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) Web APIs standards:

- [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers)

### Before/After

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

## Included middlewares

These are simple middlewares that may not fullfilled all your needs and that's why you are welcome to write your owns. They almost serve more as examples / [learning material](https://github.com/eightyfive/fetch-run/tree/master/src/use).

### Headers

- Sets common headers based on current URI

```js
import createSetHeaders from 'fetch-run/src/use/headers';

const headers = {
  _prefix: 'api/v1',

  '*': {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-AppVersion': config.API_VERSION,
    'X-Platform': Platform.OS,
  },

  '^xml/.+$': {
    Accept: 'application/xml',
    'Content-Type': 'application/xml',
  },
};

api.use(createSetHeaders(headers));
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/headers.js)

### Json response

- Converts response to JSON

```js
import jsonResponse from 'fetch-run/src/use/json';

api.use(jsonResponse);
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/json.js)

### HTTP Error

- Catches HTTP responses with error status code (`< 200 || >= 300`)
- Creates a custom `HttpError` (extends [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))
- Attaches server response to `HttpError`
- Throws `HttpError`

```js
import httpError from 'fetch-run';

api.use(httpError());

// Later in app, when you catch the `err`, `err.data` will contains the JSON error server response (`err.response` also available).
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/error.js)

### Access Token

- Remembers access token as soon as it is available in Response
- Automatically sets "Authorization" header (`Bearer <TOKEN>`) on Request once available

```js
import createSetAccessToken from 'fetch-run';

api.use(createSetAccessToken.call(api));
```

You can pass the access token identifier in Response (default is `"access_token"`):

```js
api.use(createSetAccessToken.call(api, 'AccessToken'));
```

_Note_: This middleware needs to be called with `api` context (`.call(api)`):

_Note_: If you need to initialize `accessToken` value (typically rehydration):

```js
api.setAccessToken(token);
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/access-token.js)

### Refresh Token

- Remembers refresh token as soon as it is available in Response
- Refreshes access token if server responds with `401` status code (Unauthorized)
- Replays the previous failed Request with the new/fresh access token

```js
import createRefreshToken from 'fetch-run/src/use/refresh-token';

api.use(createRefreshToken.call(api));
```

You can pass the refresh token identifier in Response (default is `"refresh_token"`):

```js
api.use(createRefreshToken.call(api, 'RefreshToken'));
```

_Note_: This middleware needs to be called with `api` context (`.call(api)`):

_Note_: If you need to initialize `refreshToken` value (typically rehydration):

```js
api.setRefreshToken(token);
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/refresh-token.js)

### Normalize Response

- Normalizes responses with [normalizr](https://github.com/paularmstrong/normalizr)

```js
import { schema } from 'normalizr';
import createNormalize from 'fetch-run/src/use/normalize';

const userSchema = new schema.Entity('users');
const messageSchema = new schema.Entity('messages');

const mapSchema = {
  _prefix: 'api/v1',

  get: {
    '^chats/d+/messages$': [messageSchema],
    // ...
  },

  post: {
    '^login$': userSchema,
    // ...
  },
};

api.use(createNormalize(mapSchema));
```

[Source code](https://github.com/eightyfive/fetch-run/blob/master/src/use/normalize.js)

_Note_: You need to install [normalizr](https://github.com/paularmstrong/normalizr).

## Polyfills

`fetch-run` requires the following polyfills when applicable:

- [fetch](https://github.com/github/fetch)
- [URL](https://github.com/lifaon74/url-polyfill)

```
$ yarn add whatwg-fetch url-polyfill

// <your-app>/src/services/api.js
import "whatwg-fetch";
import "url-polyfill";
// ...
```

## `Http` API

TODO
