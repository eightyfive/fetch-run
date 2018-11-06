# `fetch-run`

## What?

`fetch-run` is a small utility class to help deal with common use cases regarding targeting REST API endpoints.

Namely:
  - Explicitly & easily define all you API endpoints
  - Run your API calls through a middleware stack
  - Common use cases / middlewares included (access token, refresh token, normalize response, error management...)

## Install

```
$ yarn add fetch-run
```

## Usage

While you can use the `Http` class itself directly, it is recommended to `extend` it for cleaner API definition (plain method definitions / better abstraction):

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

A simple implementation of the middleware pattern in order to modify the [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and/or the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) prior to/after your API calls:

  - [Using Express middleware](https://expressjs.com/en/guide/using-middleware.html)
  - [Middleware - Laravel](https://laravel.com/docs/5.7/middleware)
  - [Middleware - Redux](https://redux.js.org/advanced/middleware)
  - ...

A good way to visualize the middleware pattern is to think of the Request/Response lifecycle [as an onion](https://www.google.com/search?q=middleware+onion&tbm=isch). Every middleware added being a new onion layer.

### `Request`/`Response`

`fetch-run` uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) Web APIs standards:

  - [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
  - [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
  - [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers)

### Before/After

Let's write a simple middleware that remembers an "Access Token" and sets it automatically on the Request once available.

```js
// src/services/http/access-token.js

let accessToken;

export default next => async req => {
  //
  // BEFORE
  // Modify/Use Request
  //

  if (accessToken) {
    req.headers.set("Authorization", `Bearer ${accessToken}`);
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

Don't hesistate to browse the [source code of middlewares](https://github.com/eightyfive/fetch-run/tree/master/src/use), it's very instrcutive and relatively simple to understand.

### Error management

- Catches HTTP errors (status code > 299)
- (Logs error in console)
- Attaches server response to [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
-  Re-throws `Error`

```js
import createErrorHandler from "fetch-run/src/use/error";

api.use(createErrorHandler());

// Later in app, when you catch the `err`, `err.data` will contains the JSON error server response.
```

You can pass a custom function that maps the server response to the `Error`:

```js
api.use(createErrorHandler(json => ({
  name: "My Http Error",
  errors: Object.values(json.errors)
})));

// Later in app, `err.errors.join(", ")`...
```

### Access Token

  - Remembers access token as soon as it is available in Response
  - Automatically sets "Authorization" header (`Bearer <TOKEN>`) on Request once available

```js
import createSetAccessToken from "fetch-run/src/use/access-token";

api.use(createSetAccessToken());
```

You can pass the access token identifier in Response (default is `"access_token"`):

```js
api.use(createSetAccessToken("AccessToken"));
```

### Refresh Token

  - Remembers refresh token as soon as it is available in Response
  - Refreshes access token if server responds with `401` status code (Unauthorized)
  - Replays the previous failed Request with the new/fresh access token

```js
import createRefreshToken from "fetch-run/src/use/refresh-token";

api.use(createRefreshToken());
```

You can pass the refresh token identifier in Response (default is `"refresh_token"`):

```js
api.use(createSetAccessToken("RefreshToken"));
```

### Normalize Response

  - Normalizes responses with [normalizr](https://github.com/paularmstrong/normalizr)

```js
import { schema } from "normalizr";
import createNormalize from "fetch-run/src/use/normalize";

const userSchema = new schema.Entity("users");
const messageSchema = new schema.Entity("messages");

const mapSchema = {
  _prefix: "api/v1",

  get: {
    "^chats/d+/messages$": [messageSchema],
    // ...
  },

  post: {
    "^login$": userSchema,
    // ...
  }
};

api.use(createNormalize(mapSchema));
```

_Note_: You need to install [normalizr](https://github.com/paularmstrong/normalizr).
