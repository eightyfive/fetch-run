import flow from 'lodash.flow';

import qs from './qs';

const isHttpUri = /^https?:\/\//;

export default /* abstract */ class HttpBase {
  constructor(baseUri, options = {}) {
    this.baseUri = baseUri;
    this.options = options;

    this.middlewares = [];
    this.stack = null;

    if (!this.options.headers) {
      this.options.headers = {};
    }
  }

  /* abstract function getKernel(); */

  /* abstract function run(req); */

  setHeader(name, value) {
    this.options.headers[name] = value;
  }

  setBearer(token) {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(path, options) {
    return this.request('GET', path, undefined, options);
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

  search(path, query, options) {
    return this.request('GET', `${path}?${qs(query)}`, undefined, options);
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

  getStack() {
    if (!this.stack) {
      this.stack = flow([this.getKernel(), ...this.middlewares]);
    }

    return {
      run(req) {
        return this.stack(req);
      },
    };
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
