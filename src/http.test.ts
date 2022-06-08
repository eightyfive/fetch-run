import { Layer } from './types';
import { Http } from './http';
import 'jest-fetch-mock';

let api: Http;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();

  api = new Http('http://example.org', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

describe('Http', () => {
  it('calls fetch', (done) => {
    api.get('api/resource').then(() => {
      const req = fetchMock.mock.calls[0][0];

      expect(req).toBeInstanceOf(Request);

      if (req instanceof Request) {
        expect(req.method).toBe('GET');
        expect(req.headers.get('Content-Type')).toBe('application/json');
        expect(req.url).toBe('http://example.org/api/resource');
      }

      done();
    });
  });

  it('adds headers', (done) => {
    api
      .get('api/resource', {
        headers: { Accept: 'application/json', 'X-Version': '0.0.1' },
      })
      .then(() => {
        const req = fetchMock.mock.calls[0][0];

        expect(req).toBeInstanceOf(Request);

        if (req instanceof Request) {
          expect(req.headers.get('Content-Type')).toBe('application/json'); // untouched
          expect(req.headers.get('Accept')).toBe('application/json');
          expect(req.headers.get('X-Version')).toBe('0.0.1');
        }

        done();
      });
  });

  it('replaces headers', (done) => {
    api
      .get('api/resource', { headers: { 'Content-Type': 'text/plain' } })
      .then(() => {
        const req = fetchMock.mock.calls[0][0];

        expect(req).toBeInstanceOf(Request);

        if (req instanceof Request) {
          expect(req.headers.get('Content-Type')).toBe('text/plain');
        }
        done();
      });
  });

  it('logs req & res', (done) => {
    const log = jest.fn();

    api.use((next) => async (req: Request) => {
      log(req);

      const res = await next(req);

      log(res);

      return res;
    });

    api.get('api/resource').then((res: Response) => {
      const req = fetchMock.mock.calls[0][0];

      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenNthCalledWith(1, req);
      expect(log).toHaveBeenNthCalledWith(2, res);
      done();
    });
  });

  it('maps res to JSON', (done) => {
    fetchMock.mockResponse('{"foo": "bar"}');

    api.use((next: Layer) => async (req: Request) => {
      const res = await next(req);

      return res.json();
    });

    api.get('api/resource').then((data: Response) => {
      expect(data).toEqual({ foo: 'bar' });

      done();
    });
  });
});
