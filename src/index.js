export default class Http {
  errorHandlers = [];
  middlewares = [];
  runFetch = null;

  constructor(baseUrl, headers = {}) {
    this.baseUrl = baseUrl;
    this.headers = headers;
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
    const url = this.getUrl(pathname, isGet ? data : undefined);
    const options = {
      method,
      headers: new Headers(this.headers),
    };

    if (data && !isGet) {
      options.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Request
    const req = new Request(url, options);

    return this.run(req);
  }

  async run(req) {
    if (!this.runFetch) {
      this.runFetch = compose(...this.middlewares)(this.fetch);
    }

    try {
      return await this.runFetch(req);
    } catch (err) {
      if (this.errorHandlers.length) {
        this.errorHandlers.forEach(handler => handler(err));
      } else {
        throw err;
      }
    }
  }

  getUrl(pathname, data) {
    let url = `${this.baseUrl}/${pathname}`;

    if (data) {
      const query = Object.keys(data)
        .map(key => `${key}=${data[key]}`)
        .join('&');

      url = `${url}?${query}`;
    }

    return url;
  }

  refreshToken(token) {
    return this.post('oauth/token', { refresh_token: token });
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
