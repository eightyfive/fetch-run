import StandardError from 'standard-error';

export default function HttpError(code, message, request, response) {
  if (typeof code !== 'number') throw new TypeError('Non-numeric HTTP code');

  StandardError.call(this, message || `HTTP Error ${code}`, {
    request,
    response,
  });

  this.code = code;
}

HttpError.prototype = Object.create(StandardError.prototype, {
  constructor: { value: HttpError, configurable: true, writable: true },
});

Object.assign(HttpError.prototype, {
  name: 'HttpError',
  toString: () => `${this.name}: ${this.code} ${this.message}`,
});
