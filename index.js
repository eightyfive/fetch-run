import qs from 'query-string';
import _trimEnd from 'lodash.trimend';

export default class Http {
  constructor(baseURI, options = {}) {
    this.baseURI = _trimEnd(baseURI, '/');
    this.options = Object.assign({ headers: {} }, options);

    this.stack = (req) => fetch(req);
  }

  use(layer) {
    this.stack = layer(this.stack);
  }

  run(req) {
    return this.stack(req);
  }

  setHeader(name, value) {
    Object.assign(this.options.headers, { [name]: value });
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
    // Headers
    const headers = Object.assign({}, this.options.headers, options.headers);

    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    // Init
    const init = Object.assign({}, options, {
      method,
      headers: new Headers(headers),
    });

    if (data && method !== 'GET') {
      init.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    // Request
    const req = new Request(`${this.baseURI}/${path}`, init);

    return this.run(req);
  }
}
