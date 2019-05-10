export default class Http {
  middlewares = [];
  runFetch = null;

  constructor(baseUrl, headers = {}) {
    this.baseUrl = baseUrl;
    this.headers = headers;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  setBearer(token) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  // Workaround:
  // https://stackoverflow.com/questions/44720448/fetch-typeerror-failed-to-execute-fetch-on-window-illegal-invocation
  fetch = req => fetch(req);

  use(middleware) {
    this.middlewares.unshift(middleware);
  }

  get(pathname, data, options) {
    return this.request('GET', pathname, data, options);
  }

  post(pathname, data, options) {
    return this.request('POST', pathname, data, options);
  }

  put(pathname, data, options) {
    return this.request('PUT', pathname, data, options);
  }

  patch(pathname, data, options) {
    return this.request('PATCH', pathname, data, options);
  }

  delete(pathname, options) {
    return this.request('DELETE', pathname, undefined, options);
  }

  request(method, pathname, data, options = {}) {
    const isGet = method === 'GET';
    const url = this.getUrl(pathname, isGet ? data : undefined);

    const headers = Object.assign({}, this.headers, options.headers);

    Object.assign(options, {
      method,
      headers: new Headers(headers),
    });

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

    return this.runFetch(req);
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
