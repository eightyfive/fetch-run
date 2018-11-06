export default class Http {
  constructor(baseUri) {
    this.baseUri = baseUri;

    this.middlewares = [];
    this.runThrough = null;
  }

  // Workaround:
  // https://stackoverflow.com/questions/44720448/fetch-typeerror-failed-to-execute-fetch-on-window-illegal-invocation
  fetch = req => fetch(req);

  use(middleware) {
    this.middlewares.unshift(middleware);
  }

  get(pathname, data) {
    return this.request("GET", pathname, data);
  }

  post(pathname, data) {
    return this.request("POST", pathname, data);
  }

  put(pathname, data) {
    return this.request("PUT", pathname, data);
  }

  patch(pathname, data) {
    return this.request("PATCH", pathname, data);
  }

  delete(pathname) {
    return this.request("DELETE", pathname);
  }

  request(method, pathname, data) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Request
    // https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
    const req = new Request(this.getUrl(pathname), {
      method,
      headers: new Headers(),
      body: data ? JSON.stringify(data) : undefined
    });

    return this.run(req);
  }

  run(req) {
    if (!this.runThrough) {
      this.runThrough = compose(...this.middlewares)(this.fetch);
    }

    return this.runThrough(req);
  }

  getUrl(pathname) {
    return `${this.baseUri}/${pathname}`;
  }

  refreshToken(token) {
    return this.post("oauth/token", { refresh_token: token });
  }

  upload(pathname, data) {
    // Body
    const formData = new FormData();

    for (let key in data) {
      formData.append(key, data[key]);
    }

    // Headers
    const req = new Request(this.getUrl(pathname), {
      method: "POST",
      headers: new Headers(),
      body: formData
    });

    return this.run(req);
  }
}

// Credits: https://github.com/reduxjs/redux/src/compose.js
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
