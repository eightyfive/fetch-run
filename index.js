import qs from 'query-string';

const reUri = /^https?:\/\//;

const o = Object;

export default class Http {
  constructor(baseUri, options = {}) {
    this.baseUri = baseUri;
    this.options = o.assign({ headers: {} }, options);

    this.stack = (req) => fetch(req);
  }

  use(layer) {
    this.stack = layer(this.stack);
  }

  run(req) {
    return this.stack(req);
  }

  setHeader(name, value) {
    o.assign(this.options.headers, { [name]: value });
  }

  setBearer(token) {
    this.setHeader('Authorization', `Bearer ${token}`);
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
    return this.request(
      'GET',
      `${path}?${qs.stringify(query)}`,
      undefined,
      options,
    );
  }

  request(method, path, data, options = {}) {
    const init = {
      ...options,
      method,
      headers: this.createHeaders(options),
    };

    if (data && method !== 'GET') {
      init.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const url = [this.baseUri, path];

    if (reUri.test(path)) {
      url.shift();
    }

    const req = new Request(url.join('/'), init);

    return this.run(req);
  }

  createHeaders(options) {
    const headers = {
      ...this.options.headers,
      ...options.headers,
    };

    for (const [key, val] of o.entries(options.headers || {})) {
      if (val === false) {
        delete headers[key];
      }
    }

    return new Headers(headers);
  }
}
