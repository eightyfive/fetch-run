export default class Http {
  errorHandlers = [];

  constructor(baseUri) {
    this.baseUri = baseUri;

    this.middlewares = [];
    this._accessToken = null;
    this._refreshToken = null;
    this.runFetch = null;
    this.refreshing = false;
  }

  // Workaround:
  // https://stackoverflow.com/questions/44720448/fetch-typeerror-failed-to-execute-fetch-on-window-illegal-invocation
  fetch = req => fetch(req);

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  use(middleware) {
    this.middlewares.unshift(middleware);
  }

  get(pathname, data) {
    return this.request('GET', pathname, data);
  }

  post(pathname, data) {
    return this.request('POST', pathname, data);
  }

  put(pathname, data) {
    return this.request('PUT', pathname, data);
  }

  patch(pathname, data) {
    return this.request('PATCH', pathname, data);
  }

  delete(pathname) {
    return this.request('DELETE', pathname);
  }

  request(method, pathname, data) {
    const isGet = method === 'GET';

    // https://developer.mozilla.org/en-US/docs/Web/API/Request
    const req = new Request(this.getUrl(pathname, isGet ? data : undefined), {
      method,
      headers: new Headers(),
      body: data && !isGet ? JSON.stringify(data) : undefined,
    });

    return this.run(req);
  }

  async run(req) {
    if (!this.runFetch) {
      this.runFetch = compose(...this.middlewares)(this.fetch);
    }

    try {
      return await this.runFetch(req);
    } catch (err) {
      this.errorHandlers.forEach(handler => handler(err));

      throw err;
    }
  }

  getUrl(pathname, data) {
    let url = `${this.baseUri}/${pathname}`;

    if (data) {
      const query = Object.keys(data)
        .map(key => `${key}=${data[key]}`)
        .join('&');

      url = `${url}?${query}`;
    }

    return url;
  }

  getAccessToken() {
    return this._accessToken;
  }

  setAccessToken(token) {
    this._accessToken = token;
  }

  getRefreshToken() {
    return this._refreshToken;
  }

  setRefreshToken(token) {
    this._refreshToken = token;
  }

  refreshToken(token) {
    return this.post('oauth/token', { refresh_token: token });
  }

  upload(pathname, data) {
    // Body
    const formData = new FormData();

    for (let key in data) {
      formData.append(key, data[key]);
    }

    // Headers
    const req = new Request(this.getUrl(pathname), {
      method: 'POST',
      headers: new Headers(),
      body: formData,
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
