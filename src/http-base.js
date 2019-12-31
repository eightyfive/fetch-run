import qs from './qs';

const isHttpUri = /^https?:\/\//;

export default /* abstract */ class HttpBase {
  middlewares = [];
  runFetch = null;

  /* abstract function getKernel(); */

  constructor(baseUri, options = {}) {
    this.baseUri = baseUri;
    this.options = options;

    if (!this.options.headers) {
      this.options.headers = {};
    }
  }

  setHeader(name, value) {
    this.options.headers[name] = value;
  }

  setBearer(token) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  use(middleware) {
    this.middlewares.unshift(middleware);
  }

  get(path, options) {
    return this.request('GET', path, undefined, options);
  }

  search(path, query, options) {
    return this.request('GET', `${path}?${qs(query)}`, undefined, options);
  }

  post(path, data, options) {
    return this.request('POST', path, data, options);
  }

  put(path, data, options) {
    return this.request('PUT', path, data, options);
  }

  patch(path, data, options) {
    return this.request('PATCH', path, data, options);
  }

  delete(path, options) {
    return this.request('DELETE', path, undefined, options);
  }

  request(method, path, data, options = {}) {
    const init = {
      ...options,
      method,
      headers: this.createHeaders(options),
    };

    if (data && method !== 'GET') {
      options.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    let url;

    if (!this.baseUri || isHttpUri.test(path)) {
      url = path;
    } else {
      url = `${this.baseUri}/${path}`;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Request
    const req = new Request(url, init);

    return this.run(req);
  }

  run(req) {
    if (!this.runFetch) {
      this.runFetch = compose(...this.middlewares)(this.getKernel());
    }

    return this.runFetch(req);
  }

  createHeaders(options) {
    const headers = new Headers({
      ...this.options.headers,
      ...options.headers,
    });

    for (let [key, val] of headers.entries()) {
      if (val === false) {
        headers.delete(key);
      }
    }

    return headers;
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
