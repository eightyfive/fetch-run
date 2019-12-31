import { from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import Http$ from './http-rx';

let api;

beforeEach(() => {
  jest.clearAllMocks();
  fetch.resetMocks();

  api = new Http$('http://example.org', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

describe('HttpRx', () => {
  it('calls fetch', done => {
    api.get('api/resource').subscribe(() => {
      const req = fetch.mock.calls[0][0];

      expect(req.method).toBe('GET');
      expect(req.headers.get('Content-Type')).toBe('application/json');
      expect(req.url).toBe('http://example.org/api/resource');

      done();
    });
  });

  it('adds headers', done => {
    api
      .get('api/resource', {
        headers: { Accept: 'application/json', 'X-Version': '0.0.1' },
      })
      .subscribe(() => {
        const req = fetch.mock.calls[0][0];

        expect(req.headers.get('Content-Type')).toBe('application/json'); // untouched
        expect(req.headers.get('Accept')).toBe('application/json');
        expect(req.headers.get('X-Version')).toBe('0.0.1');

        done();
      });
  });

  it('replaces headers', done => {
    api
      .get('api/resource', { headers: { 'Content-Type': 'text/plain' } })
      .subscribe(() => {
        const req = fetch.mock.calls[0][0];

        expect(req.headers.get('Content-Type')).toBe('text/plain');
        done();
      });
  });

  it('logs req & res', done => {
    const log = jest.fn();

    api.use(next => req$ => next(req$.pipe(tap(log))).pipe(tap(log)));

    api.get('api/resource').subscribe(res => {
      const req = fetch.mock.calls[0][0];

      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenNthCalledWith(1, req);
      expect(log).toHaveBeenNthCalledWith(2, res);
      done();
    });
  });

  it('maps res to JSON', done => {
    fetch.mockResponse('{"foo": "bar"}');

    api.use(next => req$ =>
      next(req$).pipe(switchMap(res => from(res.json()))),
    );

    api.get('api/resource').subscribe(data => {
      expect(data).toEqual({ foo: 'bar' });

      done();
    });
  });
});
