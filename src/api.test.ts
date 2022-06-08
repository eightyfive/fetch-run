import { Api } from './api';
import 'jest-fetch-mock';

type Resource = {
  id: number;
  title: string;
};

let api: Api;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
  fetchMock.mockResponse('{"foo": "bar"}');

  api = new Api('http://example.org');
});

describe('Api', () => {
  it('sets Headers', (done) => {
    api.get<Resource>('api/resource').then(() => {
      const req = fetchMock.mock.calls[0][0];

      expect(req).toBeInstanceOf(Request);

      if (req instanceof Request) {
        expect(req.headers.get('Content-Type')).toBe('application/json');
      }

      done();
    });
  });
});
