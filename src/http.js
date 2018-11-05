const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

export default class Http {
  constructor(baseUri, headers = defaultHeaders) {
    this.baseUri = baseUri;
    this.headers = { ...headers };

    this.middlewares = [];
    this.runThrough = null;
  }

  fetch = req => {
    return fetch(req).then(res => {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      }

      const err = new Error(res.statusText);
      err.response = res;

      throw err;
    });
  };

  use(middleware) {
    this.middlewares.push(middleware);
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
      headers: new Headers(this.headers),
      body: data ? JSON.stringify(data) : undefined
    });

    return this.run(req);
  }

  run(req) {
    if (!this.runThrough) {
      const middlewares = this.middlewares.slice();

      middlewares.reverse();

      this.runThrough = compose(...middlewares)(this.fetch);
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
    const headers = new Headers(this.headers);
    headers.delete("Content-Type");

    const req = new Request(this.getUrl(pathname), {
      method: "POST",
      headers,
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
